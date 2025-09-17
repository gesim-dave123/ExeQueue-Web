
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../../prisma/prisma.js'

export const loginUser = async (req, res) =>{
  const {username, password} =req.body
  console.log("Hereee")
  try {
    if(!username || !password) return res.status(403).json({success: false, message: "Required Fields are missing!"})
    const user = await prisma.sasStaff.findUnique({
      where:{
        username: username
      },
      select:{
        sasStaffId: true,
        hashedPassword: true,
        role: true,
        isActive: true
      }
    })

    if(!user) return res.status(404).json({success: false, message: "Account not found!"})
    
    const decrypt = await bcrypt.compare(password, user.hashedPassword)
    if(!decrypt) return res.status(403).json({success: false, message: 'Invalid Credentials'})
    
    const token = await jwt.sign({
      id: user.sasStaffId,
      role: user.role,
      is_active: user.isActive

    }, process.env.JWT_SECRET,
    {expiresIn: user.role === Role.PERSONNEL ? '10h': '5h'}
   );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "strict",
    maxAge: user.role === Role.PERSONNEL ? 1000 * 60 * 60 * 10 : 1000 * 60 * 60 * 5,
  });

   return res.status(200).json({
    success: true,
    message: "Logged In Successfully!",
    role: user.role,
    token: token
   })

  } catch (error) {
    console.error('Error in Login: ', error)
    return res.status(500).json({sucess: false, message: "Internal Server Error!"})
  }
}

export const createUser = (req,res)=>{
  const {
    username,
    password,
    first_name,
    last_name,
    middle_name,
    email,
    role,
  } = req.body

  try {
    if(!username?.trim() || !password?.trim()|| !email?.trim() || !role?.trim()){
      return res.status(403).json({success: false, message: "Required fields are missing!"})
    }
    if(!first_name?.trim() || !last_name?.trim()) return res.status(403).json({})
    // TODO: Continue this part, it should validate all fields
  } catch (error) {
    
  }
}

export const logoutUser = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: "strict"
  });

  return res.status(200).json({
    success:true,
    message: "Logged Out Successfully!"
  })
};