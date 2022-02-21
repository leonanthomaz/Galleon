const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../models/User');
const User = mongoose.model('users')
const bcrypt = require('bcryptjs');
const passport = require('passport');
const multer = require('multer');
const path = require('path');


router.get('/', (req, res)=>{
    res.render('user/index')
});

router.get('/register', (req, res)=>{
    res.render('user/register')
});

router.post('/register', (req, res)=>{

    var erros = []

    if(!req.body.name || typeof req.body.name === undefined || req.body.name === null){
        erros.push({text: 'Nome inválido.'});
    }

    if(!req.body.email || typeof req.body.email === undefined || req.body.email === null){
        erros.push({text: 'Email inválido.'});
    }

    if(!req.body.password || typeof req.body.password === undefined || req.body.password === null){
        erros.push({text: 'Senha inválido.'});
    }

    if(req.body.password.length < 8){
        erros.push({text: 'A senha precisa ser maior que 8 digítos.'});
    }
    
    if(req.body.password != req.body.passwordConfirme){
        erros.push({text: 'As senhas estão diferentes, tente novamente.'});
    }

    if(erros.length > 0){
        res.render('user/register', {erros: erros});
    } else {
        //Procurar se já existe um usuário cadastrado
        User.findOne({email: req.body.email}).then((user)=>{
            if(user){
                req.flash('error_msg', 'Já existe um usuário com essa conta de email');
            }else{
                const newUser = new User ({
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password
                });

                //Encryptando a senha com bcrypt
                bcrypt.genSalt(10, (err, salt)=>{
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if(err){
                            req.flash('error_msg', 'Houve um erro durante o processo de cadastro ');
                            res.redirect('/');
                        }
                        newUser.password = hash;

                        newUser.save().then(()=>{
                            req.flash('success_msg', 'Conta criada com sucesso!');
                            res.redirect('/user');
                            req.flash('success_msg', 'Bem vindo ao Galleon!')
                        }).catch(err => {
                            req.flash('error_msg', 'Houve um erro ao criar sua conta');
                            res.redirect('/user/register');
                        });
                    });
                });
            }
        }).catch(err => {
            req.flash('error_msg', 'Houve um erro interno.');
            res.redirect('/')
        });

    }
});

router.get('/login', (req, res)=>{
    res.render('user/login')
});

router.post('/login', (req, res, next) => {

    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/user/login',
        failureFlash: true,
    })(req, res, next);

});

router.get('/update', (req, res)=>{
    User.findOne({id: req.params.id}).then((user)=>{
        res.render('user/update-profile', {user: user})
    }).catch()
});

router.post('/update/add', (req, res)=>{
    User.findOne({_id: req.body.id}).then(user => {
        user.name = req.body.name,
        user.email = req.body.email

        user.save().then((response)=>{
            req.flash('success_msg', 'Perfil atualizado com sucesso.')
            //console.log(response)
            res.redirect('/')
        }).catch(()=>{
            req.flash('error_msg', 'Erro interno')
            res.redirect('user/update')
        })
    }).catch((err)=>{
        req.flash('error_msg', 'Não foi possível atualizar')
        res.redirect('user/update')
    });
});

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'uploads/')
    },
    filename: function(req, file, cb){
        cb(null, Date.now()+path.extname(file.originalname))

    }
});

const upload = multer({storage});

//rota - upload --- single: nome do input
router.post('/uploads', upload.single('photo'), (req, res)=>{
    res.send('arquivo recebido!')
})

router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'Deslogado com sucesso.');
    res.redirect('/');
});

module.exports = router;