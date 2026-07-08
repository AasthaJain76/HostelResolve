import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const getUserByEmail = async (email) => {
    const user = await prisma.user.findUnique({
        where: { email },
    })
    return user || { id: null, name: '', email: '', role: 'student', hostel: '', room: '' }
}

export default getUserByEmail
