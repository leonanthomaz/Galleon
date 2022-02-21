const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const path = require('path');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const admin = require('./routes/admin');
const flash = require('connect-flash');
const mongoose = require('mongoose');
require('./models/Post');
const Post = mongoose.model('posts');
require('./models/Category');
const Category = mongoose.model('categories');
const user = require('./routes/user');
const passport = require('passport')
require('./config/auth')(passport)

//Direcionando rota principal para o index
app.get('/', (req, res) =>{
    res.redirect('/index');
})

//Bloco padrão de incialização
//Sessão
app.use(session ({
    secret: "nodejs",
    reserve: true,
    saveUninitialized: true
}))

//Inicialização do passport
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

//Middlewares locais
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash("error")
    res.locals.user = req.user || null;
    next()
})

//BodyParser
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
    
//Handlebars
//Template.Engine
app.engine('handlebars', handlebars.engine({defaultLayout: 'main',  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
},
}));
app.set('view engine', 'handlebars');

// Mongoose
mongoose.Promise = global.Promise;
mongoose.connect("mongodb+srv://leonanthomaz:leonan2knet@clusterrevyou.ooqil.mongodb.net/RevYou?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado ao mongo.');
}).catch((err) => {
    console.log('Erro ao se conectar: ' + err);
});

//Path para direcionamento da pasta públic (JS, CSS, IMG, etc)
app.use(express.static(path.join(__dirname, 'public')))

//Rota para categorias
app.get('index', (req, res) => {
    Post.find().lean().populate('date').sort({data: 'desc'}).then((posts) => {
        res.render('/index', {posts: posts})
    }).catch((erro) => {
        req.flash("error_msg", "Houve um erro ao listar as categorias")
        res.redirect('/404')
    })
});

//Rota para categorias
app.get('/categories', (req, res) => {
    Category.find().then((categories) => {
        res.render('categories/index', {categories: categories})
    }).catch((erro) => {
        req.flash("error_msg", "Houve um erro ao listar as categorias")
        res.redirect('/')
    })
});

//capurando os posts por categoria
app.get('/categories/:slug', (req, res) => {
    Category.findOne({slug: req.params.slug}).then((category) => {
       if(category){
            Post.find({category: category._id}).then((post) =>{
                res.render('categories/posts', {posts: post, categories: category})
            }).catch((erro) => {
                req.flash("error_msg", "Houve um erro")
                res.redirect('/')
            })
       }else{
           req.flash("error_msg", "Essa categoria não existe")
           res.redirect('/')
       }
    }).catch((erro) => {
        req.flash("error_msg", "Erro ao carregar a pagina dessa categoria")
        res.redirect('/')
    })
});

//Renderizando os posts na tela inicial
app.get('/index', (req, res) => {
    Post.find().lean().populate('category').sort({data: 'desc'}).then(posts => {
        res.render('index', {posts: posts});
    }).catch(err => {
        req.flash('error_msg', 'Houve um erro interno');
        res.redirect('/404');
    });
});

//Renderizando os todos os posts em uma página unica
app.get('/posts/all', (req, res) => {
    Post.find().lean().populate('category').sort({data: 'desc'}).then(posts => {
        res.render('posts/all-posts', {posts: posts});
    }).catch(err => {
        req.flash('error_msg', 'Houve um erro interno');
        res.redirect('/404');
    });
});

//Capurando os posts a partir do slug
app.get('/posts/:slug', (req,res) => {
    const slug = req.params.slug
    Post.findOne({slug}).then(posts => {
        if(posts){
        const post = {
        title: posts.title,
        date: posts.date,
        content: posts.content
        }
            res.render('posts/index', post)
        } else {
            req.flash("error_msg", "Essa postagem nao existe")
            res.redirect("/")
            }
        }).catch(err => {
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("/")
    });
});

//Rota de erro - Página 404
app.get('/404', (req, res) => {
    res.render('404');
});

//Rota de help - Página help
app.get('/help', (req, res)=>{
    res.render('help/index')
})

//Rota de about - Página about
app.get('/about', (req, res)=>{
    res.render('about/index')
})

//Rota de user - Página user
app.use('/user', user);

//Rota de admin - Página admin
app.use('/admin', admin);

//Rota para abrir o servidor. Escutando na váriavel PORT
app.listen(PORT, ()=>{
    console.log(`Aplicativo rodando em http://localhost:${PORT}`);
})