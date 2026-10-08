const app=require('./app'); app.listen(process.env.PORT||5000,()=>console.log(`CloudCart API on ${process.env.PORT||5000}`));
