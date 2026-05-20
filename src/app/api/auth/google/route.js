import dbConnect from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-but-should-be-in-env';
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const client = new OAuth2Client(CLIENT_ID);

export async function POST(request) {
    try {
        const { credential } = await request.json();

        if (!credential) {
            return NextResponse.json({ error: 'Missing Google credential' }, { status: 400 });
        }

        // Verify the token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: CLIENT_ID, 
        });

        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        await dbConnect();

        // Find existing user or create a new one
        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name: name || 'Google User',
                email: email,
                image: picture,
                // No password handled by schema definition omitting "required" on password
            });
        }

        // Create our app's JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name, role: user.role || 'user' },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Set the same auth cookie as standard login/signup
        const serialized = serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        const response = NextResponse.json(
            { message: 'Google Login successful', user: { id: user._id, name: user.name, email: user.email, image: user.image, role: user.role || 'user' } },
            { status: 200 }
        );

        response.headers.set('Set-Cookie', serialized);

        return response;

    } catch (error) {
        console.error('Google Auth Error:', error);
        return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 });
    }
}
