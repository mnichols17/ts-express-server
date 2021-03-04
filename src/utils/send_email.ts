import nodemailer from 'nodemailer';

export default async(to: string, subject: string, text: string, html: string) => {3
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_ACCOUNT,
            pass: process.env.EMAIL_PASSWORD
        }
    })

    console.log("EMAIL", to)
    const info = await transporter.sendMail({
        from: `'tMRDB' <${process.env.EMAIL_ACCOUNT}>`,
        to,
        subject,
        text,
        html
    })

    console.log("Message sent", info.messageId)
}