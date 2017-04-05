var exec  =  require('exec');
var pg    =  require('pg');
var conString         = "postgrest://db_admin:12345@localhost:5432/autogas";

function watchful(){
  pg.connect(conString, function(err, client, done){
    if(err){             
      return console.error('error de conexion 1', err);
    }else{
      console.log("Conexion DB");
      exec('ping -c 2 www.google.com', function(err, out, code) {
        if (err instanceof Error)
          throw err;
        process.stderr.write(err);
        if(err){
          client.query("UPDATE conexion SET internet = '0';", function(err,result){
            done();
            if(err){                        
                return console.error('error de conexion', err);
            }else{
            }
          });
        }else{
          client.query("UPDATE conexion SET internet = '1';", function(err,result){
            done();
            if(err){                        
                return console.error('error de conexion', err);
            }else{
            }
          });
        }
      });
    }
    });
}

setInterval(watchful, 30000);           //Revisa el estado de internet