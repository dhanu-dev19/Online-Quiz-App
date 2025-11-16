
# Online Quiz Application

A full-stack quiz system built using **Flask (Python)**, **MySQL**, and **HTML/CSS/JavaScript**.
Users can register, log in, take quizzes, see their score, and view the leaderboard.
Admins can add questions and manage quizzes.

---

## Features

### User Features

* Register using **Name, Email, Password**
* Secure Login
* **Role-based Redirects:**

  * **User → Quiz Page**
  * **Admin → Add Question Page**
* Take MCQ quizzes
* Auto score calculation
* View result instantly
* View Leaderboard (Rank, Score/Total Mark, Time Taken)

### Admin Features

* Add new questions
* Add multiple options per question
* Mark the correct option
* Manage categories (optional)

### Leaderboard Features

* Displays **Rank, Username, Score/Total Marks, Time Taken, Date**
* Category-wise leaderboard support
* Sorted by highest score

---

## Tech Stack

### **Frontend**

* HTML
* CSS
* JavaScript (Fetch API)

### **Backend**

* Python Flask
* Flask-CORS
* MySQL Connector

### **Database**

* MySQL


## Setup Instructions

### Backend Setup (Flask)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

##  Major API Endpoints

### Authentication

* `POST /register`
* `POST /login`

### Admin

* `POST /admin/add_question`
* `POST /admin/add_category`

### Quiz

* `GET /quiz/questions`
* `POST /quiz/submit`
* `GET /quiz/leaderboard/<int:category_id>`

---

## Pages Included (HTML Templates)

### 📄 `login.html`

User login form

### 📄 `register.html`

User registration form

### 📄 `quiz.html`

Displays questions + options

### 📄 `leaderboard.html`

Shows ranking (score / total)

### 📄 `admin_add_question.html`

Admin panel for adding questions

---

## Sample Python Quiz Questions

1. What is the output of `print(3 * 'python')`?
2. Which data type does the `len()` function return?
3. What keyword is used to define a function in Python?
4. Which operator is used for exponentiation?
5. What is the correct syntax to import a module?
6. What does the `append()` function do?
7. Which of these is a mutable data type?
8. What will `type([])` return?
9. What does `//` do in Python?
10. What’s the output of `print(True + True)`?

---

## One-line Project Summary (for Resume)

**"Built a Flask + MySQL Online Quiz Application with user login, admin question management, auto score calculation, and leaderboard using HTML, CSS, and JavaScript."**

---

## Contributing

Feel free to improve the UI or add more categories/questions!

---

## License


