const {promisify} = require('util');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({path:'../.env'});
const con = require('../model/db');



exports.isLoggedIn = async(req,res,next)=>{  //Middleware
	
	console.log(req.cookies);

	if (req.cookies.jwt) {
		try{
			//Verify the token
			console.log(jwt);
			const decoded =  await promisify(jwt.verify)(
				req.cookies.jwt,
				process.env.JWT_SECRET
			);

			console.log(decoded);

			//Check if the user still exists
			con.start.query('SELECT * FROM hospital where H_id=?',[decoded.id],(err,result)=>{
				console.log(result);
				if (!result) {
					return next();
				}

				req.user = result[0];
				console.log("req.user in auth is: "+req.user);
				console.log("next");
				return next();
			});
		}catch(error){
			console.log(error);
			return next();
		}
	}else{
		next();
	}
	
}




exports.logout = async(req,res)=>{
	res.cookie('jwt','logout',{
		expires: new Date(Date.now() + 2*1000),
		httpOnly: true
	});

	res.status(200).redirect("/");
}