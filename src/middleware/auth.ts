import {Request, Response, NextFunction} from 'express';
import {Users} from '../entity/Users';

// piyiw90729@mimpi99.com
export default async(req: Request, res: Response, next: NextFunction) => {
    try{
        if(!req.session) throw('SESSION')
        if(!req.session.userId) throw('SESSION ID')
        const user = await Users.findOne({id: req.session.userId})
        if(!user) throw('NO USER')
        next();
    } catch(e) {
        // console.log("HIT ERROR", e, req.route.path)
        res.status(401).json({error: "NOT SIGNED IN"})
    }
}