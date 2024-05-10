#!/usr/bin/python3

import hashlib
import argparse

parser = argparse.ArgumentParser(
                    prog='separator',
                    description='Generate the value of a derivation path separator according to EIP2645')

parser.add_argument('string');

args = parser.parse_args()

mask = int('0x000000000000000000000000000000000000000000000000000000007FFFFFFF', 16)
print(int(hashlib.sha256(args.string.encode('UTF-8')).hexdigest(), 16) & mask)

