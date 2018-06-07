import os
import subprocess

# Format of output:
# List of errors
# Error is dictionary of ruleId, patternId, line, column, content (code that caused error)
# ruleId is what vulnerability was found

class SmartCheck:
    def __init__(self, s = None):
        self.s = s


    def print_result(self, s):
        for line in s:
            print('line:')
            print(line)
    
    def parse_result(self, s):
        s = s.replace('\r', '')
        lines = s.split('\n')
        filename = lines[0]
    
        err_list = []
    
        blocks = s.split('ruleId: ')
        for block in blocks[1:]:
            block_lines = block.split('\n')
            cur_err = {}
            cur_err['description'] = block_lines[0]
            cur_err['patternId'] = block_lines[1][11:]
            cur_err['lineno'] = block_lines[2][6:]
            cur_err['column'] = block_lines[3][8:]
            cur_err['code'] = block_lines[4][9:]
            err_list.append(cur_err)
    
        return(err_list)

    def write_file(self, code, name):
        f = open(name, 'wt', encoding='utf-8')
        f.write(code)
        f.close()
    
    def smartcheck(self, s=None):
        if not s:
            self.write_file(self.s, 'test_file.sol')
        else:
            self.write_file(s, 'test_file.sol')

        # Create image
        os.system('docker build -t vincent/smartcheck .')
    
        # Run analysis
        output = subprocess.check_output('docker run -t vincent/smartcheck:latest java -jar smartcheck/target/solidity-checker-1.0-SNAPSHOT-jar-with-dependencies.jar -p smartcheck/target/test_file.sol >> res', shell=True)
        try:
            res = subprocess.check_output(['docker', 'run', '-t', 'vincent/smartcheck:latest', 'java', '-jar', 'smartcheck/target/solidity-checker-1.0-SNAPSHOT-jar-with-dependencies.jar', '-p', 'smartcheck/target/test_file.sol'])
        except subprocess.CalledProcessError as err:
            print(err)
            return(None)
    
        res = res.decode('utf-8')
    
        formatted_res = self.parse_result(res)
        return(formatted_res)
    
if __name__ == '__main__':
    print(smartcheck())
