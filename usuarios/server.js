const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const app = express();
const users =[];

app.use(bodyParser.json());

app.set('port',3000);

app.listen(app.get('port'), ()=>{
    console.log('Server is Working');
});

/* Function to create Users */
function createId(array){
    let id = users.length+1;
    if(array.length>0){
        const last = array.slice(-1)[0].id;
        if(id<=last){
            id=(last+1);
        }
    }
    return id;
}

/* MiddleWare to validate if there's an user using email */
function validateExist(req,res,next){
    const{email} = req.body;
    const repeteadUser = users.findIndex(elem =>{
        if(elem.email == email){
            return elem;
        }
    });

    if(repeteadUser>-1){
        return res.status(409).json(`There's another user using email ${email}`);
    }
    
    return next();
}

/* MiddleWare to validate if an user exists in BD */
function validateUser(req,res,next){
    const{email} = req.query;
    const user = users.find(elem=>{
        if(elem.email = email){
            return elem;
        }
    });

    if(user){
        req.user = user;
        return next();
    }else{
        res.status(400).json(`There isn't a user with email ${email}`);
    }
}

/* Function to login */
function validateUserLogin (email,password){
    const [filtrarUsuario] = users.filter(elem=> elem.email === email && elem.password === password);
    if(!filtrarUsuario){
        return false;
    }
    return filtrarUsuario;
}

/*Validate if an user is an admin*/
const validateLogin = (req,res,next)=>{
    try{
        const token = req.headers.authorization.split(' ')[1];
        const verificarToken = jwt.verify(token,'secretoJWT#shh');
        if(verificarToken){
            req.body = verificarToken;
            return next();
        }
    }catch(err){
        res.json({error:'Error al validar al usuario'});
    }
}

/* Endpoint for creating an user */
app.post('/users',validateExist,(req,res)=>{
    const {name,lastname,email,password} = req.body;
    if(name && lastname && email && password){
        const id = createId(users);
        const newUser = {id,...req.body};
        users.push(newUser);
        res.status(201).json(newUser);
    }else{
        res.status(409);
    }
});

/* Endpoint for editing an user*/
app.put('/users',validateUser,(req,res)=>{
    const{name,lastname,email,password} = req.body;
    let user = req.user;
    if(user){
        user.name = name;
        user.lastname = lastname;
        user.email=email,
        user.password=password
        const exist = users.indexOf(user);
        if(exist>-1){
            users.splice(exist,1,user);
        }
        res.json(user);
    }
});

/* Endpoint for editing user role */
app.put('/users/role',validateUser,(req,res)=>{
    const{role} = req.body;
    let user = req.user;
    if(user){
        const exist = users.indexOf(user);
        const newUser = {...user,role};
        if(exist>-1){
            users.splice(exist,1,newUser);
        }
        res.json(newUser);
    }
});

/* Endpoint for admin to list users */
app.get('/users',validateLogin,(req,res)=>{
    const{email} = req.body;
    let user = users.find(elem =>{
        if(elem.email === email && elem.role === true){
            return elem;     
        }
    });

    if(user){
        res.json(users);
    }else{
        res.json(`Deny access`);
    }
});

/* Endpoint for login*/
app.post('/login',(req,res)=>{
    const{email,password} = req.body;
    const validate = validateUserLogin(email,password);
    if(!validate){
        res.json({error:`There isn't an user with email ${email} or your password is invalid`});
    }

    const token = jwt.sign({
        email 
    },'secretoJWT#shh');

    res.json({token});
});