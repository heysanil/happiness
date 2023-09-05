export const authorize = async (req: Request, role: 'public' | 'root'): Promise<boolean> => {
    if (!process.env.HAPPINESS_ROOT_API_KEY) {
        throw new Error('Please set the HAPPINESS_ROOT_API_KEY environment variable');
    }

    if (role === 'public') {
        return true;
    }

    if (role === 'root') {
        if (!req.headers.has('Authorization')) {
            return false;
        }
        return req.headers.get('Authorization') === `Bearer ${process.env.HAPPINESS_ROOT_API_KEY as string}`;
    }

    return false;
};
