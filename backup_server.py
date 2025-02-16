#! /usr/bin/env python

# Super simple server to save and retrieve data from a user

from flask import Flask, render_template, request, send_from_directory, redirect, jsonify
from werkzeug import serving


import re                   # regex
import json                 # JSON tools
from pathlib import Path    # Path tools

from flask_cors import CORS
app = Flask(__name__, template_folder='templates')
CORS(app)
# giza a look - debug
from pprint import pprint
# debug - delete


# https://flask.palletsprojects.com/en/0.12.x/patterns/favicon/
@app.route('/favicon.ico')
def favicon():
    print(f"favicon path: {Path(app.root_path).joinpath('static/favicon.ico')}")
    return send_from_directory(Path(app.root_path).joinpath('static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')


# import uuid
# NAMESPACE = str(uuid.uuid4())
# print("- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ")
# print(NAMESPACE)
# print("- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ")
NAMESPACE = '388e5ead-9872-4181-aef2-225b7cae61dd'
# TODO break out into own repo / paycheck * dockerise > deploy . . .
# payCheck route to test saving to server 
@app.route('/save', methods=['POST', 'GET'])
def save():
    data_dir = Path('./scratch/_save')
    
    if request.method == 'POST':
        print("PC data - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - S")
        data = request.get_json()
        command = data.get('command')
        user_uuid = data.get('userUUID')
        local_storage_key = data.get('localStorageKey')        
        # uuid regex        r'[\d\w]{8}-[\d\w]{4}-[\d\w]{4}-[\d\w]{4}-[\d\w]{12}'
        # storKey regex     r'[\d\w]{4}_[\d\w]{4}_WKS_\d\d-\d\d'
        
        if not re.match(r'[\d\w]{8}-[\d\w]{4}-[\d\w]{4}-[\d\w]{4}-[\d\w]{12}', user_uuid):
            print(f"ERROR - INVALID USER UUID {user_uuid}")
            return jsonify({'message': 'Internal Server Error - INVALID USER UUID'}), 500
        
        if not re.match(r'[\d\w]{4}_[\d\w]{4}_WKS_\d\d-\d\d', local_storage_key):
            print(f"ERROR - INVALID STORAGE KEY {local_storage_key}")
            return jsonify({'message': 'Internal Server Error - INVALID LOCAL STORAGE KEY'}), 500
        
        file_path = data_dir.joinpath(f"{user_uuid}_{local_storage_key}.json")
        pprint(data)
        print(f"FILE: {file_path}")
        print("PC data - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - E")

        if command == 'SAVE':            
            print(f"[POST] SAVE request SAVING to: {file_path}")
            try:
                with open(file_path, 'w') as json_file:
                    json.dump(data, json_file, indent=2)
                return jsonify({'message': 'Successfully saved to server'}), 200
            except Exception as e:
                print(f'Error writing file: {e}')
                return jsonify({'message': 'Internal Server Error - PROBLEM SAVING FILE'}), 500
        
        elif command == 'RETRIEVE':
            #file_path = data_dir.joinpath(f"{data['userUUID']}_{data['localStorageKey']}_data.json")
            print(f"[POST] RETRIEVING request from: {file_path}")
            try:
                with open(file_path, 'r') as json_file:
                    data = json.load(json_file)
                return jsonify(data), 200
            except Exception as e:
                print(f'Error reading file: {e}')
                return jsonify({'message': 'Internal Server Error - PROBLEM LOADING FILE'}), 500

        else: # unknown command
            return jsonify({'message': 'Internal Server Error - UKNOWN COMMAND'}), 500
        
    elif request.method == 'GET':
        file_path = data_dir.joinpath('default_GET_file.json')
        print(f"[GET] SHOULD NEVER HAPPEN from: {file_path}")
        print(f"PWD: {Path.cwd()}")
        
        try:
            with open(file_path, 'r') as json_file:
                data = json.load(json_file)
            return jsonify(data), 200
        except Exception as e:
            print(f'Error reading file: {e}')
            return jsonify({'message': 'Internal Server Error - PROBLEM LOADING FILE'}), 500


if __name__ == '__main__':
    # https://pythonprogramminglanguage.com/flask-hello-world/
    # reserved port numbers
    # https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
    app.run(host='0.0.0.0', port=50030)

    # setting up SSL for image capture:
    # https://blog.miguelgrinberg.com/post/running-your-flask-application-over-https
    # pip install pyOpenSSL
    #app.run(host='192.168.1.13', port=50030, ssl_context='adhoc')

    # Note for deployment:
    # http://flask.pocoo.org/docs/1.0/deploying/#deployment

 