declare namespace Express { interface Request { auth?: { userId:number; role:string; permissions:string[] } } }
