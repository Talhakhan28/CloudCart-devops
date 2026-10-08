const {PrismaClient}=require('@prisma/client'); const jwt=require('jsonwebtoken'); const prisma=new PrismaClient();
const asyncHandler=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const auth=asyncHandler(async(req,res,next)=>{const token=req.headers.authorization?.split(' ')[1];if(!token)throw Object.assign(new Error('Authentication required'),{status:401}); req.user=jwt.verify(token,process.env.JWT_SECRET);next()});
const admin=(req,res,next)=>req.user.role==='ADMIN'?next():next(Object.assign(new Error('Admin access required'),{status:403}));
const makeToken=u=>jwt.sign({id:u.id,role:u.role,email:u.email},process.env.JWT_SECRET,{expiresIn:'7d'}); const slug=s=>s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
module.exports={prisma,asyncHandler,auth,admin,makeToken,slug};
