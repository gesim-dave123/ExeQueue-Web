import jwt from 'jsonwebtoken';
import prisma from '../../prisma/prisma.js';
// import { PrismaClient } from '../generated/prisma/index.js'
// const prisma = new PrismaClient();

export const authenticateToken = async(req,res,next) =>{
  const authHeader =req.headers['authorization']
  const token =
      req.cookies?.token ||
      (req.headers["authorization"] &&
        req.headers["authorization"].split(" ")[1]);  if(!token) return res.status(401).json({success:true, message: "Access Denied, No token provided!"})

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.sasStaff.findUnique({
      where:{
        sas_staff_id : decoded.sas_staff_id
      }
    })
    if(!user)return res.status(404).json({success: false, message: "Account not found!"})
    delete user.hashed_password
    
    req.user = user;
    next();

  } catch (error) {
    console.error('Error in Auth: ', error)
    return res.status(500).json({success: false, message: "Internal Server Error!"})
  }
}