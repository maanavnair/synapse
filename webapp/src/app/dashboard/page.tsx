"use client"

import { useUser } from "@clerk/nextjs"

export default function Dashboard() {

    const { user } = useUser();

    return (
        <div>
            {user?.firstName}
        </div>
    )
}