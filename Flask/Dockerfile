FROM maven
MAINTAINER vinyang@ucdavis.edu

RUN git clone https://github.com/smartdec/smartcheck.git \
 && cd smartcheck \
 && mvn clean package

COPY test_file.sol /smartcheck/target/test_file.sol

RUN cd /smartcheck/target \
 && java -jar solidity-checker-1.0-SNAPSHOT-jar-with-dependencies.jar -p test_file.sol
