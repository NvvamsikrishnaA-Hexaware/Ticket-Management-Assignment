##### User registration localhost:8000/user/ - post
##### User login localhsot:8000/user/login - post
##### Create Ticket - localhost:8000/ticket - post
##### Get all tickets - Manager(can see all tickets)
##### localhost:8000/ticket? - get - get all tickets
##### localhost:8000/ticket?status=(status value) - get - only get selected status tickets
##### Get all tickets - User
##### localhost:8000/ticket? - get - all tickets raised by user 
##### Update Ticket - by Manager
##### localhost:8000/ticket/:id - put - body : {status:'inprogress'}