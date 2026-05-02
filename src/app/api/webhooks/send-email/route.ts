import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // Supabase sends the row data in 'record'
    const { recipient, subject, body } = payload.record;

    console.log(`📨 Attempting to send email to: ${recipient}`);

    const { data, error } = await resend.emails.send({
      from: 'StackBox AI <onboarding@resend.dev>', // Resend's default test sender
      to: recipient, // For the free tier, this must be YOUR email address
      subject: subject,
      html: `<div>${body}</div>`, // Wraps the AI's markdown/table in HTML
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ message: "Email Sent Successfully!", id: data?.id });
  } catch (error) {
    console.error("Webhook Internal Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}