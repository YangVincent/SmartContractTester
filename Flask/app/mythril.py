import docker
import os

class Mythril:
    def __init__(self):
            self.s = """
                contract HoneyPot {
                    mapping (address => uint) public balances;
                    function HoneyPot() payable {
                        put();
                    }
                    function put() payable {
                        balances[msg.sender] = msg.value;
                    }
                    function get() {
                        if (!msg.sender.call.value(balances[msg.sender])()) {
                            throw;
                        }
                        balances[msg.sender] = 0;
                    }
                    function() {
                        throw;
                    }
                }
                """

    def create_docker_client(self):
        client = docker.from_env()
        client.images.pull('blackwatertepes/mythril')
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

    def mythril(self, s):
        file_name = 'test_file_mythril.sol'
        image = 'docker pull blackwatertepes/mythril'

        #create and start docker container
        client = self.create_docker_client()
        self.write_file(s, file_name)
        container = self.start_container(client, image)

        #copy the test file to the docker
        self.docker_cp(file_name, ':/mythril_test', container) 
        result = container.exec_run('myth -xo json ' + file_name)

        #remove the code and stop the docker container
        os.system('rm ' + file_name)
        container.stop()
        container.remove()

        return result #result should be a json (emtpy if no errors)

if __name__ == '__main__':
    m = Mythril()
    print(m.mythril(m.s))