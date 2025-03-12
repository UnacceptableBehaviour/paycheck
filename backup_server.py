#! /usr/bin/env python

# Super simple server to save and retrieve data from a user

from flask import Flask, render_template, request, send_from_directory, redirect, jsonify
from werkzeug import serving
import bcrypt

import re                   # regex
import json                 # JSON tools
from pathlib import Path    # Path tools

from flask_cors import CORS
app = Flask(__name__, template_folder='templates', static_folder='docs')
CORS(app)
# giza a look - debug
from pprint import pprint
# debug - delete


# https://flask.palletsprojects.com/en/0.12.x/patterns/favicon/
@app.route('/favicon.ico')
def favicon():
    print(f"favicon path: {Path(app.root_path).joinpath('static/favicon.ico')}")
    return send_from_directory(Path(app.root_path).joinpath('static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')


@app.route('/')
def home():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>payCheck</title>
        <style>
            body {
                background-color: #008100;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                font-family: Arial, sans-serif;
            }
            .container {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
                max-width: 100vw;
            }
            .qr-container {
                width: 60%;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .qr-container img {
                width: 100%;
                height: auto;
            }
            .app-name {
                color: white;
                font-size: 2.2rem;
                text-align: center;
                margin-top: 20px;
                width: 80%;
            }
            a {
                text-decoration: none;
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <a href="https://unacceptablebehaviour.github.io/paycheck/">
                <div class="qr-container">
                    <img src="docs/static/assets/images/QR-code-w-icon-noShort.png" alt="payCheck QR Code">
                </div>
                <h1 class="app-name">payCheck</h1>
            </a>
        </div>
    </body>
    </html>
    """

# import uuid
# NAMESPACE = str(uuid.uuid4())
# print("- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ")
# print(NAMESPACE)
# print("- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ")
NAMESPACE = '388e5ead-9872-4181-aef2-225b7cae61dd'
# UUID:{
#     'user_name': 'John Doe',
#     'user_email': 'a@a.com',        # for PWD reset
#     'user_password': 'SHA3-512',
# }

userDB_PATH = Path('./scratch/_save/user_DB.json')
userDB = json.load(userDB_PATH.open('r'))

@app.route('/login', methods=['POST', 'GET'])
def login():
    global userDB
    
    if request.method == 'POST':
        print("Login / NEW USER - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - S")
        data = request.get_json()
        command = data.get('command')        
        user_uuid = data.get('userUUID')
        user_name = data.get('username')
        password = data.get('password')
        user_email = data.get('email')
        print(f"U: {user_name}\nUUID: {user_uuid}\nCMD: {command}")
        print(' - ^ - ')
        pprint(data)
        print(' - o - ')
        if user_uuid in userDB:
            pprint(userDB[user_uuid])
        else:
            print(f"NOT FOUND {user_uuid}")
        print(' - _ - ')
        # verify user inputs are valid - see /save route
        print("Login / NEW USER - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - E")

        if not user_uuid or user_uuid == "null" or user_uuid == "undefined":
            return jsonify({'message': 'Invalid UUID provided'}), 400

        if command == 'NEW_USER':
            print(f"[POST] CREATING ACCOUNT")
            
            # Hash the password with bcrypt (automatically includes salt)
            password_bytes = password.encode('utf-8')
            hashed_password = bcrypt.hashpw(password_bytes, bcrypt.gensalt(rounds=12))
            
            # Store the hashed password (it's a bytes object, so convert to string)
            userDB[user_uuid] = {
                'user_name': user_name,
                'user_email': user_email,
                'user_password': hashed_password.decode('utf-8'),  # Store as string
            }
            
            # Save the updated userDB to file
            try:
                with open(userDB_PATH, 'w') as json_file:
                    json.dump(userDB, json_file, indent=2)
                return jsonify({'message': 'Account successfully created'}), 200
            except Exception as e:
                print(f'Error writing user database: {e}')
                return jsonify({'message': 'Internal Server Error - PROBLEM SAVING USER'}), 500

        elif command == 'LOGIN':    # move this code to save route - no real concept of logging in
            if user_uuid in userDB:
                stored_user = userDB[user_uuid]
                stored_hash = stored_user['user_password'].encode('utf-8')
                
                # Check if the provided password matches the stored hash
                if bcrypt.checkpw(password.encode('utf-8'), stored_hash):
                    return jsonify({'message': 'Login successful', 'status': 'success'}), 200
                else:
                    return jsonify({'message': 'Invalid credentials'}), 401
            else:
                return jsonify({'message': 'User not found'}), 404

        else: # unknown command
            return jsonify({'message': 'Internal Server Error - UKNOWN COMMAND'}), 500


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
        
    # elif request.method == 'GET':
    #     file_path = data_dir.joinpath('default_GET_file.json')
    #     print(f"[GET] SHOULD NEVER HAPPEN from: {file_path}")
    #     print(f"PWD: {Path.cwd()}")
        
    #     try:
    #         with open(file_path, 'r') as json_file:
    #             data = json.load(json_file)
    #         return jsonify(data), 200
    #     except Exception as e:
    #         print(f'Error reading file: {e}')
    #         return jsonify({'message': 'Internal Server Error - PROBLEM LOADING FILE'}), 500


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

 