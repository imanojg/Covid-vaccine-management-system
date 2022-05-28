const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mysql = require("mysql");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const authController = require('./controllers/auth');

dotenv.config({ path: './.env' });
const con = require('./model/db');
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

// MYSQL CONNECTION-----------------------------------------------------------

con.start.connect((err) => {
  if (err) throw err;
  console.log('connected');
});



//Some GLOBAL VARIABLES====================================================
var pincode;
con.start.query("SELECT pincode FROM location", function (err, result, fields) {
  if (err) throw err;
  pincode = result;

});

var hospital;
con.start.query("SELECT H_name, H_address FROM hosp_data", function (err, result, fields) {
  if (err) throw err;
  hospital = result;
});

var vaccine;
con.start.query("SELECT V_name from vaccine", function (err, result) {
  if (err) throw err;
  vaccine = result;
});





/*****************************GET REQUESTS****************************/
/*********************************************************************/
var counts;
var vaccine;
app.get("/", (req, res) => {
  let sql = "select ( select count(*) from vaccinates) as count_vacc, ( select count(*) from hosp_data) as count_hosp, ( select count(*) from inventory) as count_invent from dual;";
  let sqla = "SELECT count(*) as count_,h.H_vac from vaccinates as v INNER JOIN hosp_data as h WHERE v.Hosp=h.H_id GROUP By h.H_vac";
  con.start.query(sql, function (err, result) {
    if (err) throw error;
    counts = result[0];
    con.start.query(sqla, function (err, result) {
      vaccine = result;
      res.render("home", { count: counts, vaccine: result });
    });
  })
});



//Patient form get request---------------------------------------------------
app.get("/patient", (req, res) => {
  res.render("patient", { pincodes: pincode, hospital: hospital });
});


//Stat page get request---------------------------------------------------
app.get("/stat", (req, res) => {
  let sql = "SELECT count(P_Gender) as count, ((count(P_Gender)*100)/(select count(*) from person)) as percentage, P_Gender FROM person GROUP By P_Gender";
  let sqli = "SELECT count(*) as count ,((count(H_type)*100)/(select count(*) from vacc_data)) as percentage,H_type FROM vacc_data GROUP By H_type;";
  let sqla = "SELECT count(*) as count ,((count(h_type)*100)/(select count(*) from hosp_data)) as percentage,H_type FROM hosp_data GROUP By h_type;";
  let sqlii = "select h_vac, count(*) as count, ((count(h_vac)*100)/(select count(*) from vacc_data)) as percentage from vacc_data group by h_vac;";
  let sqlb = "select (select count(*) from vaccinates where Date_first is not NULL and Date_second = '0000-00-00') as onedose, (select count(*) from vaccinates where Date_first is not NULL and Date_second is not null and Date_second != '0000-00-00') as twodose, (select count(*) from vaccinates where Date_first is NULL and Date_second is null) as nodose from dual;";
  let type2, type, vacc, dose;
  con.start.query(sqli, (err, result) => {
    if (err) throw error;
    type = result;
  });
  con.start.query(sqla, (err, result) => {
    if (err) throw error;
    type2 = result;
  });
  con.start.query(sqlii, (err, result) => {
    if (err) throw error;
    vacc = result;
  });
  con.start.query(sqlb, (err, result) => {
    if (err) throw error;
    dose = result[0];
  });
  con.start.query(sql, (err, result) => {
    if (err) throw error;
    res.render("stat", { gender: result, type: type, type2: type2, vacc: vacc, dose: dose });
  });
});


var pri;
//Choose hospital during patient registration-----------------------------------------
app.get("/choose_hosp/:pin/:pid", (req, res) => {
  con.start.query("select check_priority(P_DOB) as priority from person where P_id = ?;", req.params.pid, function (err, result) {
    if (err) throw err;
    pri = result;
  });
  let sql = "SELECT * FROM hosp_data where h_address = ?";
  con.start.query(sql, [req.params.pin], (err, result) => {
    console.log(req.params.pin);
    res.render("choose_hosp", { hospital: result, myid: req.params.pid, pri: pri[0].priority });
  });
});


//Hospital form get request---------------------------------------------------
app.get("/Registerhospital", (req, res) => {
  con.start.query("SELECT V_name from vaccine", function (err, result) {
    res.render("Registerhospital", { pincodes: pincode, message: 'Enter details to Register', color: 'success', vaccines: result });
  });
});


//Inventory form get request---------------------------------------------------
app.get("/Registerinventory", (req, res) => {
  res.render("Registerinventory", { pincodes: pincode });
});


//Inventory data from profile-----------------------------------------------------
app.get("/inventory_data", authController.isLoggedIn, (req, res) => {
  if (req.user) {
    let sql = "select i.*, s.s_time,s.s_quantity,s_id from inventory i join supplies s on s_inventory = i.i_id join hosp_data h on h.h_id = s.s_hospital where h.h_id = ? order by s.s_time desc;";
    let sql2 = "select case when h.h_type = 'P' then v.v_cost*s.s_quantity when h.h_type = 'G' then 0 end as total_cost from hosp_data h join vaccine v on v.v_name = h.h_vac join supplies s on s.s_hospital = h.h_id where h.h_id = ? order by s.s_time desc;"
    let sql3 = "select quant_rem from hospital where h_id = ?;"
    con.start.query(sql, req.user.H_id, function (err, result) {
      if (err) throw err;
      const invent_details = result;
      // console.log(invent_details);
      con.start.query(sql2, req.user.H_id, function (err, result) {
        if (err) throw error;
        const cost = result;
        con.start.query(sql3, req.user.H_id, function (err, result) {
          if (err) throw error;
          res.render('inventory_data', { inventory: invent_details, cost: cost, check: 0, quant_rem: result[0].quant_rem });
        })
      })
    });
  } else {
    res.render('hosp_login', {
      message: ''
    });
  }
});


//Login into profile if cookie exists---------------------------------------------------------
app.get("/hospitaldata", authController.isLoggedIn, (req, res) => {
  console.log("inside");
  console.log(req.user);
  if (req.user) {
    let sql1 = "select count(*) as count from vaccinates where hosp = ? and date_first is not null;";
    con.start.query(sql1, req.user.H_id, function (err, result) {
      if (err) throw err;
      const count = result[0].count;
      let sql = "select i.*, s.s_time,s.s_quantity from inventory i join supplies s on s_inventory = i.i_id join hosp_data h on h.h_id = s.s_hospital where h.h_id = ? order by s.s_time desc;";
      con.start.query(sql, req.user.H_id, function (err, result) {
        if (err) throw err;
        const invent_details = result[0];
        let sql2 = "select * from inventory;";
        con.start.query(sql2, req.user.H_id, function (err, result) {
          if (err) throw err;
          const inv = result[0].inv;
          res.render("hospitaldata", {
            user: req.user,
            invent_details: invent_details,
            count: count,
            inv: result
          });
        });
      });
    });
  }
  else {
    res.render('hosp_login', {
      message: ''
    });
  }
});


//LOGOUT request---------------------------------------------------
app.get("/logout", authController.logout);
app.get("/hosp_login", (req, res) => {
  res.render('hosp_login', {
    message: ''
  });
});


//Hospital patient data page request---------------------------------------------------
app.get("/hosp_logindata", authController.isLoggedIn, (req, res) => {
  if (req.user) {
    // let sql1 = "select * from person p join vaccinates v on v.P = p.p_id join hosp_data h on v.hosp = h.h_id where h.h_id = ?;";
    let sql1 = "call filter_patients(4, ?);";
    con.start.query(sql1, req.user.H_id, function (err, result) {
      if (err) throw err;
      res.render("hosp_logindata", {
        user: req.user,
        patient_details: result,
        message: 'All records',
        check: 0
      });
    });
  }
  else {
    res.render('hosp_login', {
      message: ''
    });
  }
});



//ONE DOSE in patient page in hospital profile request---------------------------------------------------
app.get("/onedose", authController.isLoggedIn, (req, res) => {
  if (req.user) {
    // let sql1 = "select * from person p join vaccinates v on v.P = p.p_id join hosp_data h on v.hosp = h.h_id where h.h_id = ? and v.Date_first is not NULL and v.Date_second = '0000-00-00';";
    let sql1 = "call filter_patients(1, ?);";
    con.start.query(sql1, req.user.H_id, function (err, result) {
      if (err) throw err;
      res.render("hosp_logindata", {
        user: req.user,
        patient_details: result,
        message: 'One dose administered',
        check: 0
      });
    });
  }
  else {
    res.render('hosp_login', {
      message: ''
    });
  }
});


//No DOSE in patient page in hospital profile request---------------------------------------------------
app.get("/nodose", authController.isLoggedIn, (req, res) => {
  if (req.user) {
    // let sql1 = "select * from person p join vaccinates v on v.P = p.p_id join hosp_data h on v.hosp = h.h_id where h.h_id = ? and v.Date_first is null and v.Date_second is null";
    let sql1 = "call filter_patients(3, ?);";
    con.start.query(sql1, req.user.H_id, function (err, result) {
      if (err) throw err;
      res.render("hosp_logindata", {
        user: req.user,
        patient_details: result,
        message: 'No dose administered',
        check: 0
      });
    });
  }
  else {
    res.render('hosp_login', {
      message: ''
    });
  }
});


//BOTH DOSE in patient page in hospital profile request---------------------------------------------------
app.get("/bothdose", authController.isLoggedIn, (req, res) => {
  if (req.user) {
    // let sql1 = "select * from person p join vaccinates v on v.P = p.p_id join hosp_data h on v.hosp = h.h_id where h.h_id = ? and v.Date_first != '0000-00-00' and v.Date_second != '0000-00-00';";
    let sql1 = "call filter_patients(2, ?);";
    con.start.query(sql1, req.user.H_id, function (err, result) {
      if (err) throw err;
      res.render("hosp_logindata", {
        user: req.user,
        patient_details: result,
        message: 'Both dose administered',
        check: 0
      });
    });
  }
  else {
    res.render('hosp_login', {
      message: ''
    });
  }
});

/************************POST REQUESTS*******************************/
/********************************************************************/


//Deletes records from supplies table from inventory page
app.post("/delete", authController.isLoggedIn, (req, res) => {
  if (req.user) {

    let sql = "delete FROM supplies where S_id = ? and S_hospital = ?";
    con.start.query(sql, [req.body.checkbox, req.user.H_id], (err, result) => {
      if (err) throw err;
      res.redirect("/inventory_data");
    });
  } else {
    res.redirect("/");
  }

});


//Patient registration post request-------------------------------------------------
app.post("/patient", (req, res) => {

  const val = [
    req.body.inputName,
    req.body.inputEmail,
    req.body.inputPIN,
    req.body.inputDOB,
    req.body.contact,
    req.body.optradio
  ]

  let sql = "INSERT INTO person (p_name,p_email,p_address,p_dob,p_contactno,p_gender) VALUES (?)";
  con.start.query(sql, [val], function (err, result) {
    if (err) throw err;
    console.log(result);
    const pid = result.insertId;
    console.log("Number of records inserted in patient: " + result.affectedRows);
    res.redirect("/choose_hosp/" + req.body.inputPIN + "/" + pid);
  });
});


//Choosing hospital during patient registration---------------------------------
app.post("/choose_hosp/:id", (req, res) => {

  const hosp_name = req.body.inputHOSP;
  var sql2 = "SELECT * from hosp_data where H_name = (?)";
  con.start.query(sql2, [hosp_name], function (err, result) {
    if (err) throw err;
    if (result.length === 0) {
      con.start.query("delete from person where p_id not in (select p from vaccinates);", function (err, result) {
        if (err) throw error;
        console.log('No of deleted data: ' + result.affectedRows);
      });
    } else {
      const hosp_id = result[0].H_id;
      const p_id = req.params.id;
      const values = [p_id, hosp_id];
      con.start.query("INSERT INTO vaccinates (P, Hosp) VALUES (?)", [values], function (err, result) {
        if (err) throw err;
        console.log("Number of records inserted in vaccinates: " + result.affectedRows);
        con.start.query("delete from person where p_id not in (select p from vaccinates);", function (err, result) {
          if (err) throw error;
          console.log('No of deleted data: ' + result.affectedRows);
        });
      });
    }

    return res.redirect("/");
  });
});



// This is hospital signup page post request------------------------------
app.post("/Registerhospital", (req, res) => {
  console.log(req.body)


  const name = req.body.inputName;
  const email = req.body.inputEmail;
  const contact = req.body.inputContact;
  const htype = req.body.inputhospitaltype;
  const pwd = req.body.inputPassword;
  const repwd = req.body.reinputPassword;
  const pin = req.body.inputPIN;
  const vacc = req.body.inputVACC;

  console.log(pin);
  con.start.query('SELECT h_email from hosp_data WHERE h_email = ?', [email], async (err, results) => {
    if (err) { throw err };
    if (results.length > 0) {
      return res.render("Registerhospital", {
        pincodes: pincode,
        message: 'Please Note That: That email has already been registered! Kindly headover to the login page',
        color: 'danger',
        vaccines: vaccine
      });
    } else if (pwd !== repwd) {
      return res.render("Registerhospital", {
        pincodes: pincode,
        message: 'Please Note That: Passwords do not match!',
        color: 'danger',
        vaccines: vaccine
      });
    }

    let hashedPassword = await bcrypt.hash(pwd, 8);
    console.log(hashedPassword);


    con.start.query('INSERT INTO hospital SET ?', { h_name: name, h_email: email, h_contactno: contact, h_type: htype, h_address: pin, h_pwd: hashedPassword, h_vac: vacc, quant_rem: 0 }, function (err, result) {
      if (err) throw err;
      console.log("Number of records inserted in hospital: " + result.affectedRows);
      return res.render("Registerhospital", {
        pincodes: pincode,
        message: 'Success! Your Hospital has been registered. Please login to continue.',
        color: 'success',
        vaccines: vaccine
      });
    });
  });
});



//Hospital login page post request-------------------------------------------------------
app.post('/hospital_login', async (req, res) => {

  try {
    console.log(req.body);
    const email = req.body.hospid;
    const pwd = req.body.hospwd;
    con.start.query('SELECT * from hospital WHERE h_email = ?', [email], async (err, results) => {
      console.log('Results :' + results);

      if (results.length === 0) {
        res.status(401).render("hosp_login", {
          message: 'Error: Account not found.'
        });
      } else if (!(await bcrypt.compare(pwd, results[0].H_pwd))) {
        res.status(401).render("hosp_login", {
          message: 'Error: Email or password does not match.'
        });
      } else {
        const id = results[0].H_id;
        console.log("id :" + id);
        const token = jwt.sign({ id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN
        });

        const cookieOptions = {
          expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
          ),
          httpOnly: true
        };
        res.cookie('jwt', token, cookieOptions);
        res.status(200).redirect("/hospitaldata");

      }
    });



  } catch (error) {
    console.log(error);
  }
});


//Post request to register inventory-------------------------------------------
app.post("/Registerinventory", (req, res) => {

  const val = [
    req.body.inputName,
    req.body.inputContact,
    req.body.PINinventory
  ]
  let sql = "INSERT INTO inventory (I_name,I_contactno,I_address) VALUES (?)";
  con.start.query(sql, [val], function (err, result) {
    if (err) throw err;
    console.log("Number of records inserted: " + result.affectedRows);
    res.redirect("/");
  });

});


//Post request from inventory page in hospital profile------------------------------------------
app.post("/inventory_data", authController.isLoggedIn, (req, res) => {
  if (req.user) {

    const val = [
      req.user.H_id,
      req.body.id,
      req.body.quantity,
      req.body.date
    ]

    let sqlcheck = "SELECT I_id from inventory where I_id=?";
    con.start.query(sqlcheck, [req.body.id], (err, result) => {
      if (err) throw err;
      if (result.length === 0) {
        let sql = "select i.*, s.s_time,s.s_quantity,s_id from inventory i join supplies s on s_inventory = i.i_id join hosp_data h on h.h_id = s.s_hospital where h.h_id = ? order by s.s_time desc;";
        let sql2 = "select case when h.h_type = 'P' then v.v_cost*s.s_quantity when h.h_type = 'G' then 0 end as total_cost from hosp_data h join vaccine v on v.v_name = h.h_vac join supplies s on s.s_hospital = h.h_id where h.h_id = ? order by s.s_time desc;"
        let sql3 = "select quant_rem from hospital where h_id = ?;"
        con.start.query(sql, req.user.H_id, function (err, result) {
          if (err) throw err;
          const invent_details = result;
          con.start.query(sql2, req.user.H_id, function (err, result) {
            if (err) throw error;
            const cost = result;
            con.start.query(sql3, req.user.H_id, function (err, result) {
              if (err) throw error;              
              res.render('inventory_data', { inventory: invent_details, cost: cost, check: 1, quant_rem: result[0].quant_rem });
            })
          })
        });
      } else {
        let sql3 = "INSERT INTO supplies (S_hospital,S_inventory,S_quantity,S_time) VALUES (?)";
        con.start.query(sql3, [val], function (err, result) {
          if (err) throw err;
          console.log("Number of records inserted in inventory: " + result.affectedRows);
          res.redirect('/inventory_data');
        });
      }
    });
  }

  else {
    res.render('hosp_login', {
      message: ''
    });
  }

});


//Hospital after logging in can see this page for adding patient data-------------------------------------------
app.post("/hosp_logindata", authController.isLoggedIn, (req, res) => {
  if (req.user) {
    console.log(req.body);
    const val = [[req.body.dose1], [req.body.dose2], [req.user.H_id], [req.body.id]];
    // let sql4 = "Update vaccinates SET Date_first = ?, Date_second = ? where Hosp = ? and P = ?;";
    let sqlcheck = "SELECT quant_rem FROM Hospital WHERE H_id=?";
    let flag;
    con.start.query(sqlcheck, [req.user.H_id], (err, result) => {
      if (err) throw err;
      const quantity = result[0].quant_rem;
      if (req.body.dose1 !== '' && req.body.dose2 === '' && quantity >= 1) {
        flag = 1;
      } else if (req.body.dose1 !== '' && req.body.dose2 !== '' && quantity >= 1) {
        flag = 1;
      } else {
        flag = 0;
      }
      console.log(flag);
      if (flag === 1) {

        let sql4 = "Update vaccinates SET Date_first = ?, Date_second = ? where Hosp = ? and P = ?";

        con.start.query(sql4, val, function (err, result) {
          if (err) { // if quant_rem in hospital is 0, error is thrown so redirect to all_records
            // let sql1 = "select * from person p join vaccinates v on v.P = p.p_id join hosp_data h on v.hosp = h.h_id where h.h_id = ?;";
            throw err;
            let sql1 = "call filter_patients(4, ?);";
            con.start.query(sql1, req.user.H_id, function (err, result) {
              if (err) throw err;
              res.render("hosp_logindata", {
                user: req.user,
                patient_details: result,
                message: 'All records',
                check: 1
              });
            });
            return;
          };
          console.log("Number of records updated: " + result.affectedRows);
          if (result.affectedRows === 0) { // if there are errors in updation
            let sql1 = "select * from person p join vaccinates v on v.P = p.p_id join hosp_data h on v.hosp = h.h_id where h.h_id = ?;";
            con.start.query(sql1, req.user.H_id, function (err, result) {
              if (err) throw err;
              res.render("hosp_logindata", {
                user: req.user,
                patient_details: result,
                message: 'All records',
                check: 1
              });

            });

          } else {
            res.redirect('/hosp_logindata');
          }
        });
      } else {
        let sql1 = "select * from person p join vaccinates v on v.P = p.p_id join hosp_data h on v.hosp = h.h_id where h.h_id = ?;";
        con.start.query(sql1, req.user.H_id, function (err, result) {
          if (err) throw err;
          res.render("hosp_logindata", {
            user: req.user,
            patient_details: result,
            message: 'All records',
            check: 1
          });
        });

      }
    });




  }
  else {
    res.render('hosp_login', {
      message: ''
    });
  }
});


/*******************************************************/
app.listen(3000, function () {
  console.log('Running on http://localhost:3000');
});
