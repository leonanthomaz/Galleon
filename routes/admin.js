const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../models/Post');
const Post = mongoose.model('posts');
require('../models/Category');
const Category = mongoose.model('categories');

//renderizar para a página inicial
router.get('/', (req, res)=>{
    res.render('admin/index')
});

//rota de categorias - listagem
router.get('/categories', (req, res)=>{
    Category.find().then((categorias)=>{
        res.render('admin/categories', {categories: categorias})
    }).catch(()=>{
        req.flash('error_msg', 'Houve um erro ao listar as categorias!')
    })
})

//rota de categorias - adicionar categoria
router.get('/categories/add', (req, res)=>{
    res.render('admin/add-category')
});

//rota de categorias - inclusão de categoria nova e validação
router.post('/category/new', (req, res)=>{

    let erros = [];

    if(!req.body.name || typeof req.body.name == undefined || req.body.name == null){
        erros.push({text: 'Nome da categoria inválido!'})
    }

    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null ){
        erros.push({text: 'Nome do slug inválido!'})
    }

    if(req.body.slug.length < 2){
        erros.push({text: 'Nome da slug muito curto!'})
    }

    if(erros.length > 0){
        res.render('/', {
            erros: erros
        });
    }else{
        const NewCategory = {
            name: req.body.name,
            slug: req.body.slug,
        }
        new Category(NewCategory).save().then(()=>{
            req.flash('success_msg', 'Categoria Cadastrada com sucesso!');
            res.redirect('/')
        }).catch(()=>{
            req.flash('error_msg', 'Falha ao cadastrar categoria...');
            res.redirect('/');
        });
    }
});

// Rota para update de categoria
router.get('/category/edit/:id', (req, res) => {
    Category.findOne({_id: req.params.id}).lean().then((categories) => {

        res.render('admin/edit-category', {categories: categories});

    }).catch(err => {
        req.flash('error_msg', 'Esta categoria não existe');
        res.redirect('admin/categories');
    })
});


// Rota responsável por deletar uma categoria.
router.post('/categories/delete', (req, res) => {
    Category.deleteOne({_id: req.body.id}).then(() => {
        req.flash('success_msg', 'Categoria deletada com sucesso.');
        res.redirect('/admin/categories');
    }).catch(err => {
        req.flash('error_msg', 'Houve um erro ao deletar a categoria.');
        res.redirect('/admin/categories');
    });
});

//rota de posts - listagem
router.get('/posts', (req, res)=>{
    Post.find().lean().populate('category').sort({data: 'desc'}).then((posts)=>{
        res.render('admin/posts', {posts: posts})
    }).catch(()=>{
        req.flash('error_msg', 'Houve um erro ao listar as postagens.')
        res.redirect('admin/posts');
    })
})

//rota de posts - inclusão
router.get('/posts/add', (req, res)=>{
    Category.find().then((categorias)=>{
        res.render('admin/add-post', {categories: categorias})
    }).catch(()=>{
        req.flash('error_msg', 'Erro interno')
    })
});

//rota de posts - inclusão e validação
router.post('/posts/new', (req, res)=>{

    let erros = [];

    if(!req.body.title || typeof req.body.title === undefined || req.body.title === null){
        erros.push({text: 'O título não pode ficar em branco!'})
    }

    if(!req.body.content || req.body.content === null){
        erros.push({text: 'Escreva algo!'})
    }

    if(!req.body.slug || typeof req.body.slug === undefined || req.body.slug === null){
        erros.push({text: 'Digite uma tag!'})
    }

    if(!req.body.category || typeof req.body.category === undefined || req.body.category === null){
        erros.push({text: 'A categoria não pode ficar em branco'})
    }

    if(erros.length > 0){
        res.render('/', {
            erros: erros
        });
    }else{
        const NewPost = {
            title: req.body.title,
            content: req.body.content,
            desc: req.body.desc,
            slug: req.body.slug,
            category: req.body.category,
        }
        new Post(NewPost).save().then(()=>{
            req.flash('success_msg', 'Post enviado com sucesso!');
            res.redirect('/');
        }).catch(()=>{
            req.flash('error_msg', 'Falha ao enviar postagem!');
            res.redirect('/');
        });
    }

});

// Rota para a edição de posts
router.get('/posts/edit/:id', (req, res) => {

    Post.findOne({_id: req.params.id}).lean().then(post => {

        Category.find().lean().then(categories => {
            res.render('admin/edit-posts', {categories: categories, post: post});
        }).catch(err => {
            req.flash('error_msg', 'Houve um erro ao listar as categorias.');
            res.redirect('/admin/posts');
        });

    }).catch(err => {
        req.flash('error_msg', 'Houve um erro ao carregar o formulário de edição.');
        res.redirect('/admin/posts');
    });
});

// Rota para o salvamento do post
router.post('/posts/edit', (req, res) => {
        
    Post.findOne({_id: req.body.id}).then(post => {
        post.title = req.body.title;
        post.slug = req.body.slug;
        post.desc = req.body.desc;
        post.content = req.body.content;
        post.category = req.body.category;

        post.save().then((response) =>{
            req.flash('success_msg', 'Postagem editada com sucesso.')
            console.log(response)
            res.redirect('/admin/posts')
        }).catch(() => {
            req.flash('error_msg', 'Erro interno')
            res.redirect('/admin/posts')
        });

    }).catch((erro) => {
        req.flash('error_msg', 'Houve um erro ao salvar a edição.');
        console.log(erro)
        res.redirect('/admin/posts');
    });
});

//rota de posts - deletar
router.get('/posts/delete/:id', (req, res) => {
    Post.remove({_id: req.params.id}).then(() => {
        req.flash('success_msg', 'Postagem deletada com sucesso.');
        res.redirect('/admin/posts');
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interdo');
        res.redirect('admin/posts');
    });
});



module.exports = router;