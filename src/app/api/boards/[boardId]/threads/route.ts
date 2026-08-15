import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req:NextRequest,{params}:{params: Promise<{boardId: string}>}){
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if(!session?.user?.id){
      return NextResponse.json({error: "Unauthorized"},{status:401})
    };

    const {boardId} = await params;

    const threads = await prisma.commentThread.findMany({
      where: {boardId},
      include: {
        comments:{
          include:{
            user: {
              select:{ id: true, name: true, image: true },
            },
          },
          orderBy: {createdAt:"asc"} // time wise data in ascending.
        },
      },
      orderBy: {createdAt:"asc"}
    });

    return NextResponse.json(threads);
  } catch (error) {
    console.error("Threads are not fetching...",error);
    return NextResponse.json({error: "Internal server error"},{status:500});
  }
}

// 2. Naya Thread create karein (Canvas par first pin drop)
export async function POST(req:NextRequest,{params}:{params:Promise<{boardId:string}>}){
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if(!session?.user?.id){
      return NextResponse.json({error: "Unauthorized"},{status:401})
    }
    const { boardId } = await params;
    const { x, y, content } = await req.json(); // as x,y will be there with content.
    if(x== undefined || y==undefined || !content?.trim()){
      return NextResponse.json({ error: "Coordinates and content required" }, { status: 400 });
    }
    const newThread = await prisma.commentThread.create({
      data: {
        boardId,x,y,
        comments:{
          create:{ // thread row create + comment added in table also
            userId: session.user.id, // user who is commenting.
            content: content.trim(),
          },
        },
      },
      include: {
        comments: {
          include: {
            user: { select: { id: true, name: true, image: true } }, // for image,name of user.
          },
        },
      },
    });
    return NextResponse.json(newThread, { status: 201 });
  } catch (error) {
    console.error("Thread is not creating...:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}