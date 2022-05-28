# COVAC-(Arm yourself Against Covid-19)
 [![Made withExpress](https://img.shields.io/badge/Made%20with-Express-yellow?style=for-the-badge&logo=NodeJS)]() [![Made MUI](https://img.shields.io/badge/Made%20with-CSS-orange?style=for-the-badge&logo=css)]()  [![Made withMySQL](https://img.shields.io/badge/Made%20with-MySQL-blue?style=for-the-badge&logo=MySQL)]()  ![Made withNode.js](https://img.shields.io/badge/Made%20with-Node.js-green?style=for-the-badge&logo=node.js)
<br>
<img src="public/images/logo.png"><br>
This project is developed as an academic project for DBMS subject . It is Web Application based which controls and maintains the flow of vaccines.<br>
<br>


### Prerequisites
Must haves:
- MYSQL(Using XAMPP)
- Node.js
- Git Bash


## Getting Started
Clone the repository in your local machine.
```
git clone https://github.com/imanojg/COVID-VACCINE-DATABASE-MANAGEMENT-SYSTEM.git
```

Traverse to the cloned folder in your pc using your terminal and then install all the dependencies.<br>
```
npm install 
```

Dependencies that are used for the project include:
<br>

```
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mysql = require("mysql");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
```
After installing the dependencies run the project using the following command to run it on localhost. Make sure before running the project, you create the database in your xampp server by pasting the commands in tables.sql file. On starting the execution, the project will run on port 3000. We have also used PL-SQL in our project. Make sure you also add the procedures, triggers and functions of pl sql (from tables.sql file) in your xampp server before running the project.<br>
```
npm start
```
<br>


## ER Diagram
<img src="refer/er.png">
<br>

## Mysql Connection
```
const mysql = require("mysql");

exports.start = mysql.createConnection({ 
  host: process.env.DATABASE_HOST, 
  user: process.env.DATABASE_USER, 
  password:process.env.DATABASE_PWD,
  database : process.env.DATABASE
});
```
```
con.start.connect((err) => {
  if (err) throw err;
  console.log('connected');
});
```


## The Concept Behind
Our web app using mysql database manages all the patients, hospital and inventory data.<br>
Inventory supplies vaccine to any specific hospitals. Each hospital provides a particular brand of vaccine (Say Covaxin or Covishield). Patients can register for hospitals in their area and the hospital can view all the patient requests for vaccine in their hospital on creating an account and logging in inside <b> COVAC<b>. This aids in easy management of data for the hospitals. All Inventory details are visible in the hospital profile page.Also hospitals can add data in the inventory page inside their profile that shows all inventory that are linked to that hospital and quantity of vaccines they have supplied to the respective hospital in the past. Hospitals can also handle information related to patients and add the dates when the patients received their first and second dose of the vaccine. All this data is instantly updated in the databse. The site is end to end validated.<br><br>
We also provide a statistics page. Site viewers can view statistics of percentage of male, female and others category patients who have registered in our website. <br><br>
<img src="refer/gender.png">
<br><br>There are various other details that are shown through various mysql queries. Data like percentage of patients who have received different vaccines and the number of doses different patients have received. All this data helps the viewers to analyse and make conclusions.<br><br>
<img src="refer/details.png">
<br><br> We have also shown the total hospitals that have registered in our website, along with the count and percentage of those which are private and government. This helps the viewers get to know their choices and helps in easy analysis of information.<br><br>
<img src="refer/hospital.png">
<br>

## Built With
- HTML - Markup language
- CSS - Style Sheet language
- Javascript- Client Scripting language
- MySQL - Database Management
- node.js - Backend Development environment
- express.js - Fast, unopinionated, minimalist web framework for Node.js

## Contributors
- Manoj G
- Naresh Kumar M

