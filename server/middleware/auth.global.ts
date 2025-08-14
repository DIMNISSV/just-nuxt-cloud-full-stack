
import { getUserFromEvent, UserContext } from '~/server/utils/auth'

declare module 'h3' {
    interface H3EventContext {
        user?: UserContext
    }
}

export default defineEventHandler((event) => {
    
    const user = getUserFromEvent(event)

    
    
    if (user) {
        event.context.user = user
    }
})