import {Router, Request, Response} from 'express';
import {redis_client} from '../utils/redis_client';
import * as yup from 'yup';
import sendEmail from '../utils/send_email';
import {Users} from '../entity/Users';
import {Lists} from '../entity/Lists';
import {v4 as uuidv4} from 'uuid';
import bcrypt from 'bcryptjs';
import 'reflect-metadata';
import auth from '../middleware/auth';

const clientURL = process.env.NODE_ENV === 'production'? "https://5f6adcf5a45deb82be940c86--mrdb.netlify.app" : 'http://localhost:3000'
    //"https://www.movierankings.net" : 'http://localhost:3000'
const router = Router();
const user_prefix = 'user_sess';

const confirmEmailLink = async(userId: string) => {
    const id = uuidv4();
    await redis_client.setex(id, 60 * 60 * 24, userId); // Expire after 24 hours
    return `${clientURL}/confirm/${id}`;
}

/* Route: /users */

router.get('/confirm/:id', async(req: Request, res: Response) => {
    const {id} = req.params;
    redis_client.get(id, async(err, result) => {
        if(result) {
            await Users.update({id: result}, {confirmed: true})
            await redis_client.del(id)
            // console.log(result)
            res.json({msg: "EMAIL CONFIRMED"})
        } else res.status(400).json({error: "INVALID CONFIRMATION"})
    })
})

router.get('/auth', auth, async(req: Request, res: Response) => {
    res.json({user: true});
})

router.get('/profile', auth, async(req: Request, res: Response) => {
    const user = await Users.findOne({
        select: ['email', 'username', 'firstname', 'lastname'],
        where: {id: (req.session as any).userId}
    })
    res.json(user)
})

router.post('/lists', auth, async(req: Request, res: Response) => {
    const {id, type, add} = req.body
    if(req.session && req.session.userId){
        const user_id = req.session.userId
        // console.log(id, type, add)
        if(add){
            const list_item = Lists.create({
                user_id, 
                review_id: id,
                type
            })
            await list_item.save()
        }
        else Lists.delete({user_id, review_id: id, type})

        redis_client.del(`${user_id}-landing`)
        redis_client.del(`${user_id}-lists`)
        redis_client.del(`${user_id}-${id}`)
    }
    res.json({msg: "LIST UPDATED"})
})

router.post('/register', async(req: Request, res: Response) => {

    const {email, username, firstName, lastName, password, passwordCheck} = req.body;

    // @TODO: Use .matches for password (no spaces in password + allow "!" and other stuff)
    const registerSchema = yup.object().shape({
        email: yup.string().lowercase().trim().min(3, "Email must contain at least 3 characters").max(255).email("Please enter a valid email address"),
        username: yup.string().trim().min(3, "Username must contain at least 3 characters").matches(/^[a-zA-Z1-9_.-]+$/, "Please use only valid characters in your username").max(100),
        firstName: yup.string().trim().min(1, "First name must contain at least 1 character").max(255),
        lastName: yup.string().trim().min(1, "Last name must contain at least 1 character").max(255),
        password: yup.string().trim().min(8, "Password must contain at least 8 characters").max(255),
        passwordCheck: yup.string().trim().matches(RegExp(password), "Passwords must match")
    })  

    registerSchema.validate({
        email,
        username,
        firstName,
        lastName,
        password,
        passwordCheck
    })
    .then(async(data:any) => {

        const userExists = await Users.createQueryBuilder('users')
            .select('users.id')
            .where('users.email = :email', {email: data.email})
            .orWhere('LOWER(users.username) = LOWER(:username)', {username: data.username})
            .getOne();
        
        if(userExists) {
            // console.log("ALREADY EXISTS")
            res.status(400).json({error: "USER ALREADY EXISTS"})
        }
        else {
            // console.log("GOOD")
            const user = Users.create({
                email: data.email,
                username,
                password,
                firstname: firstName,
                lastname: lastName,
            })
    
            await user.save();

            const link = await confirmEmailLink(user.id)

            // console.log(link);

            const emailText = `${firstName}, 
                Thanks for creating a profile on The Movie Ranking Database. 
                Click the link (${link}) to confirm your email address and to start using your account. Enjoy! 
                - The Movie Rankings Database Team.`
            const emailHtml = `<p>${firstName},</p>
                <p>Thanks for creating a profile on The Movie Ranking Database.</p>
                <p>Click <a href=${link}>here</a> to confirm your email address and to start using your account. Enjoy!</p>
                <p>- The Movie Rankings Database Team.</p>`
            sendEmail(email, "Confirm your email", emailText, emailHtml);

            res.json({msg: "WORKING"})
        }
    })
    .catch((err:any) => {
        // console.log(err.errors[0])
        res.status(400).json({error: "INVALID INFORMATION"})
    })
})

router.post('/login', async(req: Request, res: Response) => {

    const {user, password} = req.body;

    const loginSchema = yup.object().shape({
        user: yup.string().lowercase().trim().min(3, "Invalid email/username").max(255).required("Please enter information in each field"),
        password: yup.string().trim().min(3, "Invalid password").max(255).required("Please enter information in each field"),
    }) 

    loginSchema.validate({
        user,
        password
    })
    .then(async(data:any) => {

        // console.log(data.user)
        const user = await Users.createQueryBuilder('users')
            .where('users.email = :email', {email: data.user})
            .orWhere('LOWER(users.username) = :username', {username: data.user})
            .getOne();
        
        // @TODO(?) Forgot password
        if(!user) {
            // console.log("DOESN'T EXIST")
            res.status(400).json({error: "Account doesn't exist"})
        }
        else if(!user.confirmed) {
            // console.log("DIDN'T CONFIRM EMAIL")
            res.status(400).json({error: "Please confirm your email to begin using your account"})
        }
        else {

            const passwordMatch = await bcrypt.compare(password, user.password);

            if(!passwordMatch) res.status(400).json({error: "Password doesn't match for that account"})
            else {
                // SESSION ID HERE
                if(req.session) {
                    // console.log("SESSION ID SET")
                    req.session.userId = user.id;
                    if(req.sessionID) await redis_client.lpush(`${user_prefix}${user.id}`, req.sessionID);
                }
                res.json({sessionId: req.session? req.session.userId : null, msg: "WORKING"})
            }
        }
    })
    .catch((err:any) => {
        // console.log(err.errors[0])
        res.status(400).json({error: "ERROR"})
    })
})

router.post('/logout', async(req: Request, res: Response) => {
    if(req.session && req.session.userId) {
        redis_client.lrange(`${user_prefix}${req.session.userId}`, 0, -1, async(err:any, result: any[]) => {
            if(err) console.log("ERROR IN REDIS LOGOUT")
            else {
                const promises: any[] = [];
                result.forEach(async(r:string) => promises.push(redis_client.del(`sess:${r}`)))
                await Promise.all(promises);
            }
        })
        
        req.session.destroy
        res.clearCookie('session_id');
        res.json({msg: "USER LOGGED OUT"})
    } else {
        res.status(401).json({error: "NO CURRENT USER"})
    }
})

// router.get('/test', async(req: Request, res: Response) => {
//     const user = await Users.findOne({username: 'mnichols'})
//     if(!user) return [];
//     await Lists.create({user_id: user.id, review_id: 238}).save();
//     const temp = await Lists.find()
//     const l = await Lists.find({
//         select: ['review_id'],
//         where: {user_id: user.id}
//     })
//     const reviews = await Review.find({id: In([...l.map(l => l.review_id)])})
//     // console.log(reviews)
//     res.json([])
// })

export default router;