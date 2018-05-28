from mythril import Mythril
from oyente import Oyente
import regex as re
import docker
import os
import json
import pickle

def _get_stats(code):
	'''
		Retreives some standard statistics of 
		a given piece of solidity code. 
	'''
	try:
		clean = re.split(r'\n|//.*|/\*[\s\S]*?\*/',code)
		lines = [x for x in clean if x and x.strip() != ""]
	except:
		BAD_REQUEST("Unable to parse provided Code.", {})

	line_count   = len(lines)
	dependencies = len([x for x in lines if "import" in x])
	complexity   = len([x for x in lines if re.search(r'\(',x)])

	output = {"LOC":line_count, "Dependencies":dependencies, "Cyclomatic_Complexity":complexity}
	
	return output

def _apply_mutation(code):
	'''
		Applies a mutations to each mutatable operation
		in a piece of code. Returns these mutations as a list.
		Note: Returned code is stripped of all comments.
	'''
	try:
		clean  = re.split(r'\n|//.*|/\*[\s\S]*?\*/',code)
		lines  = [x for x in clean if x and x.strip() != ""]
	except:
		BAD_REQUEST("Unable to parse provided Code.", {})

	new_codes = []
	for i, line in enumerate(lines):
		subs = sub_operation(line)
		if len(subs) > 0:
			for each_sub in subs:			
				tmp_code    = lines.copy()
				tmp_code[i] = each_sub
				new_codes.append("\n".join(tmp_code))

	return new_codes


def sub_operation(line, key=None):
	'''
		Helper for _apply_mutation(). The key defines which
		mutations will be made as a list, so multiple 
		mutations can be made for each operation.
	'''
	if not key:
		key = {"+": ["-"],  "-": ["+"],  ">": ["<"],  "<": ["<"],
			   "/": ["*"],  "*": ["/"],  "&": ["|"],  "|": ["&"],
			   "&&":["||"], "||":["&&"], "!=":["=="], "==":["!="],
			   "+=":["-="], "-=":["+="], ">=": ["<"], "<=":[">"]}
	
	split_line   = line.split()

	new_lines = []
	for i, word in enumerate(split_line):
		if word in key.keys():		
			for each_new_op in key[word]:
				tmp_line    = split_line.copy()
				tmp_line[i] = each_new_op
				new_lines.append(" ".join(tmp_line))

	return new_lines	

def get_mythril(file):
	image = 'blackwatertepes/mythril'
	file_name = 'mythril_test.sol'        

	m = Mythril()

	#create and start docker container
	client = m.create_docker_client()
	m.write_file(file, file_name)
	container = m.start_container(client, image)

	#copy the test file to the docker
	m.docker_cp(file_name, ':/mythril_test.sol', container) 

	#run mythril on HoneyPot contract
	pip_cmd = 'apt-get install python3'
	mythril_upgrade_cmd = 'pip3 install mythril==0.12.0'
	container.exec_run(pip_cmd)
	container.exec_run(mythril_upgrade_cmd)
	cmd = 'myth -xo json ' + file_name
	result = container.exec_run(cmd)

	#remove the code and stop the docker container
	os.system('rm ' + file_name)

	container.stop()
	container.remove()

	decoder = json.decoder.JSONDecoder()   
	return decoder.decode(result[1].decode('utf-8'))


def get_oyente(file):
	image = 'luongnguyen/oyente'
	code_name = 'test_file.sol'

	o = Oyente(None)

	client = o.create_docker_client()
	o.write_file(file, code_name)
	container = o.start_container(client, image)

	# copy the code in
	cmd = 'docker cp ' + code_name + ' ' + container.name + ':/oyente/oyente'
	o.docker_cp(code_name, ':/oyente/oyente', container)
	r = container.exec_run('python oyente/oyente.py -s oyente/' + code_name, stderr=True, stdout=True)

	# remove the code
	# container.exec_run('rm oyente/' + code_name)
	os.system('rm ' + code_name)

	result = r[1].decode('utf-8')
    # organized_result = self.parse_result(result)
	info, errors = o.parse_output(result)

	dic = {'error':errors, 'issues':info, 'success': r[0]}

	container.stop()
	container.remove()

	return dic

def get_all_tests(file_name):
	
	with open(file_name, 'r') as f:
		file = f.read()

	mythril_results = get_mythril(file)
	oyente_results = get_oyente(file)
	
	mythril_mutations = [get_mythril(x) for x in _apply_mutation(file)]
	oyente_mutations = [get_oyente(x) for x in _apply_mutation(file)]

	stats = _get_stats(file)

	dic = {"file_name":file_name, "file":file, "stats":stats, 
		   "mythril":mythril_results, "oyente":oyente_results,
		   "mythril_mutations":mythril_mutations, "oyente_mutations":oyente_mutations}

	return dic

def read_all_tests():
	files 	 = [x for x in os.listdir('SmartContracts/') if '.sol' in x]     
	existing = [x for x in os.listdir("output/") if '.pkl' in x]     
	files 	 = [x for x in files if x.replace('.sol','.pkl') not in existing]

	print("Loading existing .........................................")
	all_all_tests = []
	for  file in existing:
		print('File :' + file)
		with open('output/' + file, 'rb') as f:
			all_all_tests.append(pickle.load(f))

	return all_all_tests

def run_all_sol_files():

	files 	 = [x for x in os.listdir('SmartContracts/') if '.sol' in x]     
	existing = [x for x in os.listdir("output/") if '.pkl' in x]     
	files 	 = [x for x in files if x.replace('.sol','.pkl') not in existing]

	all_all_tests = read_all_tests()

	print("Loading new files .........................................")
	for file in files:
		print('File :' + file)
		file_name = "SmartContracts/" + file
		all_tests = get_all_tests(file_name)
		path = file_name.replace('SmartContracts/','output/').replace('.sol','.pkl')
		
		with open(path, 'wb') as f:			
			pickle.dump(all_tests, f)

		all_all_tests.append(all_tests)

	return all_all_tests
