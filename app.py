import os
import sqlite3
from datetime import datetime
from flask import Flask, jsonify, render_template, request

DATE_FORMAT = "%Y/%m/%d %H:%M:%S"

# Configure application
app = Flask(__name__, "/static")

# Main page
@app.route("/", methods=["GET"])
def index():
    # Connect to database
    connection = sqlite3.connect("notes.db")
    cursor = connection.cursor()

    # Create table in database
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY NOT NULL,
            date TEXT NOT NULL,
            title TEXT,
            note TEXT,
            status BOOLEAN
        );
    ''')

    # Read all notes from db
    cursor.execute("SELECT * FROM notes ORDER BY date DESC;")
    rows = cursor.fetchall()

    # Close connection to db
    cursor.close()
    connection.close()

    return render_template("index.html", rows=rows, datetime=datetime)


# CREATE new note
@app.route("/api/notes", methods=["POST"])
def notes():
    # Default values for new note
    title = "New Note"
    note = "Additional Text"
    date = datetime.now().strftime(DATE_FORMAT)

    # Connect to database
    connection = sqlite3.connect("notes.db")
    cursor = connection.cursor()

    # Create new note in db
    cursor.execute("INSERT INTO notes (date,title,note,status) VALUES (?,?,?,?);", (date,title,note,1))
    connection.commit()

    # Close connection to db
    cursor.close()
    connection.close()

    return jsonify({"status": 200})


@app.route("/api/notes/<int:id>", methods=["DELETE", "GET", "POST"])
def note(id):
    # Connect to database
    connection = sqlite3.connect("notes.db")
    cursor = connection.cursor()
    
    # UPDATE note
    if request.method == "POST":
        # Get JSON response from front-end
        note_data = request.get_json()
        note_id = note_data["id"]
        title = note_data["title"]
        note = note_data["note"]
        date = datetime.now().strftime(DATE_FORMAT)

        # Save to db
        cursor.execute("UPDATE notes SET date=?, title=?, note=?, status=? WHERE id=?;", (date,title,note,0,note_id))
        connection.commit()

        # Close connection to db
        cursor.close()
        connection.close()

        return jsonify(note_data)
    # DELETE note
    elif request.method == "DELETE":
        # Delete note in db
        cursor.execute("DELETE FROM notes WHERE id=?;", (id,))
        connection.commit()

        # Read all notes from db
        cursor.execute("SELECT * FROM notes ORDER BY date DESC;")
        rows = cursor.fetchall()

        # Create new note if db is empty
        if not rows:
            notes()

        # Close connection to db
        cursor.close()
        connection.close()

        return jsonify({"status": 200})
    # READ note
    else:
        cursor.execute("SELECT * FROM notes WHERE id=?;", (id,))
        note = cursor.fetchall()

        cursor.close()
        connection.close()

        # Send data as JSON
        return jsonify(note)


if __name__ == "__main__":
    app.run(debug=True)