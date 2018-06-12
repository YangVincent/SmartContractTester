# SmartContractTesting
A Smarter Smart Contract Testing Tester

## Overview
This platform works by integrating smart contract analyzers. The user puts in 
Solidity files and receives corresponding reports from the analyzers.  

## Running the Flask App ##

To run the app, we used python3.6. It may or may not work with other versions. 
First, install the required python packages with 

`pip3 install -r requirements.txt`

Then navigate to the `Flask` directory and run 

`python3 run.py`

Once this is done, you can view the app at 

`http://0.0.0.0:5000/`

Moreover, since the `debug` flag is set in `run.py`, changing any python file will automatically update the app while running. 

## Collaboration
We split up the responsibilities into different sections. Everyone did some work on everything.

Doug:
* Wrote related work, abstract, conclusion, analysis methods, and mutations & static analysis
studies in the paper. 
* Built the backend to support the user interface. This includes functions for mutating and producing static analysis statistics of the Solidity scripts. Moreover, performed Oyente and Mythril testing on each script including mutation and static analysis.
* Wrote analysis regarding specific solidity scripts.
* Supported the UI development with new Table displays and aggregated all test suites.
* Made the test results asynchronous

Joe: 
* Created front-end for the platform. This uses the ace editor to display and edit code.
Bootstrap was used for the buttons and general UI layout. 
* Wrote user interface for analysis, testing comparisons under results and analysis, 
and various other edits in the paper. 

Sahana:
* Researched smart contract analyzers
* Implemented Mythril backend with docker containers. This takes in a Solidity
file, runs it through Mythril, then parses and returns the results in a standardized
manner. 
* Wrote Mythril testing suite section in the paper. 

Vincent:
* Researched smart contract analyzers
* Implemented Oyente backend with docker containers. This takes in a Solidity
file, runs it through Oyente, then parses and returns the results in a standardized
manner. 
* Implemented SmartCheck backend with docker containers. This takes in a Solidity
file, runs it through SmartCheck, then parses and returns the results in a standardized
manner. 
* Wrote Introduction, Oyente, SmartCheck, choosing testing suites, and future work sections in the paper. Revised and made
various other edits to the paper. 


## Directory
* /report holds the source for our report and the report.
* /Flask holds the actual project
* /tests/SmartContracts holds smart contracts we tested with
* /tests holds code used for analytics and tests
