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
    console.log("Decoded Token:", decoded); // Debugging line
    const user = await prisma.sasStaff.findUnique({
      where:{
        sasStaffId : decoded.id
      }
    })
    if(!user)return res.status(404).json({success: false, message: "Account not found!"})
    delete user.hashedPassword
    console.log("Authenticated User:", user); // Debugging line
    req.user = user;
    next();

  } catch (error) {
    console.error('Error in Auth: ', error)
    return res.status(500).json({success: false, message: "Internal Server Error!"})
  }
}

export const authorizeRoles = (...allowedRoles) =>{
  return (req,res,next) =>{
    if(!req.user || !allowedRoles.includes(req.user.role)){
      return res.status(403).json({success: false, message: "Forbidden: Unathorized Access"})
    }
    next();
  }
}