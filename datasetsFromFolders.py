
#!/usr/bin/python

# Convert annotations collected for the interface
#
#
import glob
import os.path
from pprint import pprint
import argparse
import json


directories=[]

directory = glob.glob('./data/logs/*')

# take all the name of the folders
for element in directory:
    if os.path.isdir(element):
        directories.append(os.path.basename(element))

# put in correct json format
data_converted = [{"name": "Select Dataset", "url": ""}]
for directory in directories:
    data_converted.append({
        "name":directory,
        "url":"./data/logs/"+directory+"/data.json"
    })

# now write
with open('config/datasets.json', 'w') as f:
    f.write(json.dumps(data_converted, sort_keys=True, indent=2, separators=(',', ': ')))