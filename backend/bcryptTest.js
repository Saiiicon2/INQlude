const bcrypt=require('bcryptjs');
(async()=>{
 console.log('compare1',await bcrypt.compare('password','$2b$10$MMoq6yLHBth46TIk6G0JlOZPd3FD9/P3ICJZEMeiCQRS9rCYAfAmm')); 
 console.log('compare2',await bcrypt.compare('password','$2b$10$NRmSwWhzPlMdXhgQ//uFvuzSckDolmwKbnyeVtFJlNSdIZ7KPJdky')); 
})();
