import userModel from '../models/User.js'
import bcrypt from 'bcrypt'
import { generateToken } from '../lib/utils.js';
import { sendWelcomeEmail } from '../emails/emailHandler.js';

import dotenv from "dotenv"
dotenv.config()


// import dotenv from "dotenv"
// dotenv.config()  instead of this using in every file we can just import ENV from env.js in lib folder
import {ENV} from '../lib/env.js'
import cloudinary from '../lib/cloudinary.js';



export const signup=async(req,res)=>{
    try{
        let {fullName,email,password}=req.body;//we cannot have this without app.use(express.json()) in app.js file
        if(!fullName || !email || !password ){
            return res.status(400).json({message:"All feilds are required"});
        }
        if(password.length<6){
            return res.status(400).json({message:"Password must be at least 6 characters"})
        }
        //checking if email is valid or not through:regex(regular expression)
        const emailRegex=/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if(!emailRegex.test(email))
            return res.status(400).json({message:"Invalid Email Format"});
    
        //to check if user already existed-->
        const user=await userModel.findOne({email:email})
        if(user){
            return res.status(400).json({message:"user already existed"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser=await userModel.create({
            fullName,
            email,
            password:hashedPassword,
        })
        if(newUser){
            
            generateToken(newUser._id,res)//giving res so that we can store signup token in browser in terms of cookie
            try{
                sendWelcomeEmail(newUser.email,newUser.fullName,ENV.CLIENT_URL)
            }catch(err){
                console.error("Failed to sent welcome email!:",err)
            }
            return res.status(201).json({
                _id:newUser._id,  
                fullName:newUser.fullName,
                email:newUser.email,
                
            })
        }
        else{
            res.status(400).json({message:"Invalid user data"});
        }

}catch(err){
    console.log("error in signup controller:",err);
    res.status(500).json({message:"Internal Server error"})
    
}
}




export const login=async(req,res)=>{
    try{
        const{email,password}=req.body;
        if(!email||!password){
            return res.status(400).json({message:"all feilds are required "})
        }
        if(password.length<6){
                return res.status(400).json({message:"Password must be at least 6 characters"})
        }
        const user=await userModel.findOne({email:email});
        if(!user){
            return res.status(400).json({message:"Invalid Credentials"});//never tell the client which one is incorrect (email or password)
        }
        const isPasswordCorrect=await bcrypt.compare(password,user.password);
        if(!isPasswordCorrect){
            return res.status(400).json({message:"Invalid Credentials"})
        }
        generateToken(user._id,res);
    
        try{
            sendWelcomeEmail(user.email,user.fullName,ENV.CLIENT_URL)
        }catch(err){
            console.error("Error Sending Welcome Email:",err);
        }
        return res.status(200).json({
            _id:user._id,  
            fullName:user.fullName,
            email:user.email,
        })
    }catch(err){
        console.error("error in login controller:",err);
        res.status(500).json({message:"Internal Server Error"})
        
    }

    
}


export const logout=(_, res)=>{//logout not need to be async function and req is not required
    res.cookie("jwt","",{maxAge:0});
    res.status(200).json({message:"Logged Out Successfully"});
}



// Update any subset of the editable profile fields: full name, about/bio, and/or
// profile picture. Email is identity and stays read-only. Returns the updated user
// (without password) directly, so the frontend can set it as authUser.
export const updateProfile=async(req,res)=>{
    try{
        const { profilePic, fullName, about } = req.body;
        const userId = req.user._id;

        const updates = {};
        if (typeof fullName === "string" && fullName.trim()) updates.fullName = fullName.trim();
        if (typeof about === "string") updates.about = about.trim().slice(0, 200);
        if (profilePic) {
            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            updates.profilePic = uploadResponse.secure_url;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "Nothing to update" });
        }

        const updatedUser = await userModel
            .findByIdAndUpdate(userId, updates, { new: true })
            .select("-password");
        res.status(200).json(updatedUser);
    }catch(err){
        console.error("Error in update profile:",err);
        res.status(500).json({message:"internal server error"})
    }
}

// Change the user's password. Requires the current password (verified with bcrypt)
// before setting the new one.
export const changePassword=async(req,res)=>{
    try{
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new password are required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        const user = await userModel.findById(req.user._id); // includes password
        const isCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isCorrect) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ message: "Password updated successfully" });
    }catch(err){
        console.error("Error in change password:",err);
        res.status(500).json({message:"internal server error"})
    }
}

