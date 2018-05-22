import regex as re
import docker
import os


class Oyente:
    def __init__(self, s):
        if not s:
            self.s = """
            contract greeter {
                /* Declare variable admin which will store an address */
                address public admin;
            
                /* this function is executed at initialization and sets the owner of the contract */
                function greeter() {
                    admin = msg.sender;
                }
            
                /* main function */
                function greet(bytes32 input) returns (bytes32) {
                    if (input == "") {  return "Hello, World"; }
            
                    /* Try it yourself: the joker
                    if (input=="Who's there?") {
                        // insert a joke here
                    } else if (msg.value > 1000) {
                        // a trillionth of an ether. It's a cheap joke.
                        return "Knock knock!";
                    }
                    */
            
                    return input;
                }
            
                /* Function to recover the funds on the contract */
                function kill() {
                    if (msg.sender == admin) {
                        suicide(admin);
                    }
                }
            }
            """
        else:
            self.s = s

    def create_docker_client(self):
        client = docker.from_env()
        client.images.pull('luongnguyen/oyente')
        return(client)
    
    def write_file(self, code, name):
        f = open(name, 'wt', encoding='utf-8')
        f.write(code)
        f.close()
        
    def start_container(self, client, image):
        container = client.containers.run(image, tty=True, detach=True)
        return(container)
    
    def docker_cp(self, filename, dest, container):
        cmd = 'docker cp ' + filename + ' ' + container.name + dest
        os.system(cmd)
    
    def parse_result(self, result):
        start_marker = '============ Results ==========='
        scanning = False
        results = []
        end_marker = '====== Analysis Completed ======'
        for row in result:
            print(row)
            if start_marker in row:
                scanning = True
            elif scanning and end_marker in row:
                return(results)
            elif scanning:
                row_res = row.split(':')
                for i in range(len(row_res)):
                    row_res[i] = row_res[i].strip()
                results.append(row_res[2:])

    def parse_output(self, result):

        info = []
        errors = []
        lines = result.split('INFO:symExec:')
        start_marker = '============ Results ==========='
        end_marker = '====== Analysis Completed ======'
        scanning = False
        for line in lines:
            if start_marker in line:     
                scanning = True
                continue

            s = re.split(r'([a-zA-Z]+.sol:\d+:\d+:)', line)
            if len(s) == 1 and scanning:
                if end_marker in line:
                    scanning = False
                    continue

                row_res = line.split(':')
                for i in range(len(row_res)):
                    row_res[i] = row_res[i].strip()
                info.append(tuple(row_res))

            if len(s) > 1:
                for i in range(1, len(s)-2, 2):
                    errors.append((s[i], s[i+1]))

        return(info, errors)
    
    def oyente(self, s):
        code_name = 'test_file.sol'
        image = 'luongnguyen/oyente'
        
        client = self.create_docker_client()
        self.write_file(s, code_name)
        container = self.start_container(client, image)
        
        # copy the code in
        cmd = 'docker cp ' + code_name + ' ' + container.name + ':/oyente/oyente'
        self.docker_cp(code_name, ':/oyente/oyente', container)
        r = container.exec_run('python oyente/oyente.py -s oyente/' + code_name, stderr=True, stdout=True)
        
        # remove the code
        # container.exec_run('rm oyente/' + code_name)
        os.system('rm ' + code_name)
        container.stop()
        container.remove()
        
        # result = r[1].decode('utf-8').split('\n')
        result = r[1].decode('utf-8')
        # organized_result = self.parse_result(result)
        info, errors = self.parse_output(result)
    
        return(info, errors)
    
if __name__ == '__main__':
    o = Oyente(None)
    print(o.oyente(o.s))
