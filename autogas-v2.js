/*
*********************************************************************************************************
*                                           MUX CODE
*
*                             (c) Copyright 2015; Sistemas Insepet LTDA
*
*               All rights reserved.  Protected by international copyright laws.
*               Knowledge of the source code may NOT be used to develop a similar product.
*               Please help us continue to provide the Embedded community with the finest
*               software available.  Your honesty is greatly appreciated.
*********************************************************************************************************
*/
/*
*********************************************************************************************************
*                                             INCLUDE LIB
*********************************************************************************************************
*/

var ds              = require("xmldeserializer");
var trycatch        = require('trycatch');
var sprintf         = require("sprintf").sprintf;
var rest_autorizar  = require("request");
var rest_venta      = require("request");
var sp              = require('bonescript');
var sp2             = require('bonescript');
var pg              = require('pg');
/*
*********************************************************************************************************
*                                    DECLARACION DE VARIABLES
*********************************************************************************************************
*/
var port_mux          = '/dev/ttyO4';
var config_port_mux   = { baudrate: 9200};


var port_print        = '/dev/ttyO1';
var config_port_print = {baudrate: 115200, parser: sp2.serialParsers.readline("*")};// 115200

     
var conString         = "postgrest://db_admin:12345@localhost:5432/autogas";
/*****************Variables para el flujo***************************/
var b_bd;           //0 Estado Ok - 1 Problema BD al autorizar - 2 Problema al ingresar venta BD
var b_enviada;
var corte_ok;
/**************Variables para la autorizacion***********************/
var cantidadAutorizada;
var codigoRetorno;
var idproducto;
var numeroAutorizacion;
var retorno;
var tipoConvenio;
var tipoRetorno;
var trama;
var valorConvenio;
var fecha;
var error_local;
var imp;
/**************Variables para la venta*****************************/
var codigoError;
var dineroDia;
var dineroMes;
var dineroSema;
var nombreCuenta;
var placa;
var retorno;
var saldo;
var visitasDia;
var visitasMes;
var visitasSema;
var volDia;
var volMes;
var volSema;
var imprime_saldo;
var imprime_contadores;
var total_vol_p1;
var total_vol_p2;
var total_vol_p3;
var n_producto1;
var n_producto2;
var n_producto3;
var idenproducto1;
var idenproducto2;
var idenproducto3;
var productos;
var id_p1;
var id_p2;
var id_p3;
var id_p4;
var permite;
var linea1;
var linea2;
var nit;
var tel;
var dir;
var footer;
var url_auto;
var url_save;

/********************Arreglos**************************************/            
serial          = new Buffer(16); 
precio          = new Buffer(5);
preset          = new Buffer(7); /*global preset*/
km              = new Buffer(7);
idestacion      = new Buffer(4);
autorizacion    = new Buffer(38);
volumen         = new Buffer(7);
dinero          = new Buffer(7);
var id_venta        = new Buffer(7);
var producto1       = new Buffer(12);
var producto2       = new Buffer(12);
var producto3       = new Buffer(12);
/*
*********************************************************************************************************
*                                    TOMA DE DATOS PARA RECIBOS
*********************************************************************************************************
*/

/*
*********************************************************************************************************
*                                     INICIALIZACIÓN DEL MÓDULO                                         *
*                                                                                                       *
*   Lee la base de datos para determinar si hay ventas sin cerrar e inicializar los nombres de los      *
*   productos según la última configuración y ultima venta                                              *
*********************************************************************************************************
*/
    
function reinicio(error){
     if (error){
       console.log(error);
     }else{
         permite = 0;
         pg.connect(conString, function(err, client, done){
         if(err){
             b_bd = 1;
             return console.error('error de conexion 1', err);
         }else{
             
              client.query("SELECT linea1, linea2, nit, tel, dir, footer, url, url_save FROM recibo;", function(err,result){
                    done();
                    if(err){
                        b_bd = 2;
                        return console.error('error de conexion', err);
                    }else{
                    linea1 = result.rows[0].linea1;
                    linea2 = result.rows[0].linea2;
                    nit = result.rows[0].nit;
                    tel = result.rows[0].tel;
                    dir = result.rows[0].dir;
                    footer = result.rows[0].footer;
                    url_auto = result.rows[0].url;
                    url_save = result.rows[0].url_save;
                    }
              });
             
             
             client.query(sprintf("SELECT MAX(id) FROM venta"), function(err,result){
             done();
             if(err){
                 b_bd = 1;
                 return console.error('error de conexion 2', err);
             }else{
                 var last_id = result.rows[0].max;
                 client.query(sprintf("SELECT enviada FROM venta WHERE id ='%1$s'",last_id), function(err,result){
                    done();
                    if(err){
                        b_bd = 1;
                        return console.error('error de conexion 2', err);
                    }else{
                    console.log(result.rows[0].enviada);
                    if (result.rows[0].enviada == false){
                        sp2.serialWrite(port_print,'VENTA INCOMPLETA\n');
                        sp2.serialWrite(port_print,'REALICE CIERRE DE TURNO\n');
                        sp2.serialWrite(port_print,'PARA INICIAR VENTA\n\n\n\n\n\n');
                        permite = 0;
                    }else{
                        permite = 1;
                    }
                    
                    }
            });
            }
            });
            id_p1 = 0;
            id_p2 = 0;  //Posiciones de los productos
            id_p3 = 0;  //Ej id_p1 = 2  Diesel (producto 1 en posición 2) 
            id_p4 = 0;  // id_px = 0; no hay producto en dispensador
            idenproducto1 = 0;   // Identificador de producto según manguera
            idenproducto2 = 0;   // (Diesel = 1, Corriente = 2, Extra = 3, Supreme Diesel = 4)
            idenproducto3 = 0;
            client.query(sprintf("SELECT MAX(diesel) FROM productos"), function(err,result){
            done();
            if(err){
                b_bd = 1;
                return console.error('error de conexion 2', err);
            }else{
                switch (result.rows[0].max){
                    case 1:
                        n_producto1 = 'Diesel';
                        idenproducto1 = 1;
                        id_p1 = 1;
                    break;
                    
                    case 2:
                        n_producto2 = 'Diesel';
                        idenproducto2 = 1;
                        id_p1 = 2;
                    break;
                    
                    case 3:
                        n_producto3 = 'Diesel';
                        idenproducto3 = 1;
                        id_p1 = 3;
                    break;
                }
            } 
                                
        });
        
        client.query(sprintf("SELECT MAX(corriente) FROM productos"), function(err,result){
            done();
            if(err){
                b_bd = 1;
                return console.error('error de conexion 2', err);
            }else{
                switch (result.rows[0].max){
                    case 1:
                        n_producto1 = 'Corriente';
                        idenproducto1 = 2;
                        id_p2 = 1;
                    break;
                    
                    case 2:
                        n_producto2 = 'Corriente';
                        idenproducto2 = 2;
                        id_p2 = 2;
                    break;
                    
                    case 3:
                        n_producto3 = 'Corriente';
                        idenproducto3 = 2;
                        id_p2 = 3;
                    break;
                }
            } 
        });
        client.query(sprintf("SELECT MAX(extra) FROM productos"), function(err,result){
            done();
            if(err){
                b_bd = 1;
                return console.error('error de conexion 2', err);
            }else{
                switch (result.rows[0].max){
                    case 1:
                        n_producto1 = 'Extra';
                        idenproducto1 = 3;
                        id_p3 = 1;
                    break;
                    
                    case 2:
                        n_producto2 = 'Extra';
                        idenproducto2 = 3;
                        id_p3 = 2;
                    break;
                    
                    case 3:
                        n_producto3 = 'Extra';
                        idenproducto3 = 3;
                        id_p3 = 3;
                    break;
                }
            } 
        });
        client.query(sprintf("SELECT MAX(s_diesel) FROM productos"), function(err,result){
            done();
            if(err){
                b_bd = 1;
                return console.error('error de conexion 2', err);
            }else{
                switch (result.rows[0].max){
                    case 1:
                        n_producto1 = 'S Diesel';
                        idenproducto1 = 4;
                        id_p4 = 1;
                    break;
                    
                    case 2:
                        n_producto2 = 'S Diesel';
                        idenproducto2 = 4;
                        id_p4 = 2;
                    break;
                    
                    case 3:
                        n_producto3 = 'S Diesel';
                        idenproducto3 = 4;
                        id_p4 = 3;
                    break;
                }
                productos = id_p1 + id_p2 + id_p3 + id_p4; // identifica cantidad de mangueras configuradas
                console.log(productos);
                console.log(n_producto1);
                console.log(n_producto2);
                console.log(n_producto3);
                console.log('P1:'+idenproducto1);
                console.log('P2:'+idenproducto2);
                console.log('P3:'+idenproducto3);
            } 
        });
        }   
    });
   }
}

/*
*********************************************************************************************************
*                                    function abrir(error)
*
* Description : Abre el puerto serial para la comunicacion con el mux
*               
*********************************************************************************************************
*/


function abrir(ev){
    
    if (ev.err) {
        console.log('***ERROR*** ' + JSON.stringify(ev));
    }
    if (ev.event == 'open') {
       console.log('***OPENED***');
       corte_ok=0;
       b_enviada = 'TRUE';
       console.log('open '+port_mux);
       reinicio();
   
    }
    if (ev.event == 'data') {
        rx_data_mux(ev.data);
        console.log(String(ev.data));
    }
}

/*
*********************************************************************************************************
*                                    function polling(error)
*
* Description : Abre el puerto serial para la comunicacion con el mux
*               
*********************************************************************************************************
*/


function polling(ev){
    
    if (ev.err) {
        console.log('***ERROR*** ' + JSON.stringify(ev));
    }
    if (ev.event == 'data') {
        rx_data_mux(ev.data);
        console.log(String(ev.data));
    }
        
}
/*
*********************************************************************************************************
*                                    abrir_print(error)(error)
*
* Description : Abre el puerto serial para la comunicacion con la impresora
*               
*********************************************************************************************************
*/

function abrir_print(ev){
    
    if (ev.err) {
        console.log('***ERROR*** ' + JSON.stringify(ev));
    }
    if (ev.event == 'open') {
       console.log('***OPENED***');
       console.log('open '+port_print);
    }
    if (ev.event == 'data') {
        console.log(String(ev.data));
    }
}


/*
*********************************************************************************************************
*                                function corte_manual()
*
* Description : Imprime corte pulsado desde pantalla
*               
*********************************************************************************************************
*/
function corte_manual(){
    corte_ok=1;
    permite = 1;
    pg.connect(conString, function(err, client, done){
        if(err){
            b_bd = 1;
            return console.error('error de conexion 1', err);
        }else{
            console.log('Entro a corte');
            client.query("SELECT MAX(id) FROM cortem;", function(err,result){
                done();
                if(err){
                    b_bd = 2;
                    return console.error('error de conexion', err);
                }else{
                    var last_corte = result.rows[0].max;
                   
                    sp2.serialWrite(port_print,'  '+linea1 +'\n');
                    sp2.serialWrite(port_print,'   '+linea2 +'\n');
                    sp2.serialWrite(port_print,'      '+nit+'\n');
                    sp2.serialWrite(port_print,'      Tel: '+tel+'\n');
                    sp2.serialWrite(port_print,'  '+dir+ '\n\n');                      
                    sp2.serialWrite(port_print,'  Corte de venta \n\n');
                    sp2.serialWrite(port_print,'No de Corte: ' + String(last_corte+1) + '\n\n');
                    var f = new Date();
					sp2.serialWrite(port_print,'Fecha:' + String(f.getDate() + "-" + (f.getMonth() + 1) + "-" + f.getFullYear() + ' ' + f.getHours() + ':' + f.getMinutes()) + '\n\n');                                                      
                    sp.serialRead    
                    }
                
                
            });
            client.query("SELECT MAX(ultima_venta) FROM cortem;", function(err,result){
                done();
                if(err){
                    b_bd = 2;
                    return console.error('error de conexion', err);
                }else{
                    var last_id = result.rows[0].max;
                    console.log('Resultado: '+result.rows[0].max);
                    // Lee el último volumen electrónico del equipo en la DB y hace la resta con el valor enviado por el equipo
                    client.query(sprintf("SELECT MAX(CAST(u_vol AS INT)) FROM cortem;"),function(err,result){
						        done();
						        if(err){
							        return console.error('error de conexion 2',err);
						        }else{
						            total_vol_p1 = parseFloat(producto1)/100 - parseFloat(result.rows[0].max)/100; /*global producto1*/
						            console.log(total_vol_p1);
						        }
						    });
			        client.query(sprintf("SELECT MAX(CAST(u_vol_2 AS INT)) FROM cortem;"),function(err,result){
						        done();
						        if(err){
							        return console.error('error de conexion 2',err);
						        }else{
						            total_vol_p2 = parseFloat(producto2)/100 - parseFloat(result.rows[0].max)/100; /*global producto2*/
						            console.log(total_vol_p2);
						        }
						    });	
						    client.query(sprintf("SELECT MAX(CAST(u_vol_3 AS INT)) FROM cortem;"),function(err,result){
						        done();
						        if(err){
							        return console.error('error de conexion 2',err);
						        }else{
						            total_vol_p3 = parseFloat(producto3)/100 - parseFloat(result.rows[0].max)/100; /*global producto3*/
						            console.log(total_vol_p3);
						        }
						    });
                    
                    
                    //<!--Sumatoria de dinero de las ventas realizadas por Beagle-->
                    client.query(sprintf("SELECT SUM(CAST(dinero AS INT)),COUNT(dinero) FROM venta WHERE id>%1$s AND producto='%2$s'; ", last_id,idenproducto1), function(err,result){
						done();
						if(err){
							return console.error('error de conexion 2',err);
						}else{
						    console.log("Primer producto");
						    console.log('Cuenta'+result.rows[0].count);
						    sp2.serialWrite(port_print,'Ventas ' +n_producto1+':' + String(result.rows[0].count) + '\n'); 
                            if(result.rows[0].sum==null){
                                result.rows[0].sum=0;}
							sp2.serialWrite(port_print,'Total '+n_producto1+' $ :' + String(result.rows[0].sum) + '\n');
							sp2.serialWrite(port_print,'Total '+n_producto1+' G :' +String(total_vol_p1.toFixed(2)) + '\n');
							sp2.serialWrite(port_print,n_producto1+' Vol. Final: ' +parseFloat(producto1)/100 + '\n\n');							
						}
					});
					
					if(productos > 2)
					{
					    console.log("Segundo producto");
                    client.query(sprintf("SELECT SUM(CAST(dinero AS INT)),COUNT(dinero) FROM venta WHERE id>%1$s AND producto='%2$s'; ", last_id,idenproducto2), function(err,result){
                        done();
                        if(err){
                            return console.error('error de conexion 2', err);
                        }else{
                            console.log('Cuenta'+result.rows[0].count);
                            sp2.serialWrite(port_print,'Ventas '+n_producto2+':' + String(result.rows[0].count) + '\n'); 
                            if(result.rows[0].sum==null){
                                result.rows[0].sum=0;}
                            sp2.serialWrite(port_print,'Total '+n_producto2+' $: ' + String(result.rows[0].sum) + '\n');
                            sp2.serialWrite(port_print,'Total '+n_producto2+' G:' +String(total_vol_p2.toFixed(2)) + '\n');
                            sp2.serialWrite(port_print,n_producto2+' Vol. Final: ' + parseFloat(producto2)/100 + '\n\n');
                        }
                    });
					}
					
                    if (productos > 5)
                    {
                        console.log("Tercer producto");
					client.query(sprintf("SELECT SUM(CAST(dinero AS INT)),COUNT(dinero) FROM venta WHERE id>%1$s AND producto='%2$s'; ", last_id,idenproducto3), function(err,result){
                        done();
                        if(err){
                            return console.error('error de conexion 2', err);
                        }else{
                            console.log('Cuenta'+result.rows[0].count);
                            sp2.serialWrite(port_print,'Ventas '+n_producto3+':' + String(result.rows[0].count) + '\n'); 
                            if(result.rows[0].sum==null){
                            result.rows[0].sum=0;}
                            sp2.serialWrite(port_print,'Total '+n_producto3+' $: ' + String(result.rows[0].sum) + '\n');
                            sp2.serialWrite(port_print,'Total '+n_producto3+' G: ' +String(total_vol_p3.toFixed(2)) + '\n');
                            sp2.serialWrite(port_print,n_producto3+' Vol. Final: ' + parseFloat(producto3)/100 + '\n\n');
                        } 
                    });
                    }
					
                    if(imprime_contadores == 1){       
                                sp2.serialWrite(port_print,'Visitas: ' + visitasDia + 'd  ' + visitasSema + 's  ' + visitasMes + 'm  ' + '\n\n\n');
                                sp2.serialWrite(port_print,'Volumen dia: G' + volDia +'\n\n');
                                sp2.serialWrite(port_print,'Volumen sem: G' + volSema +'\n\n');
                                sp2.serialWrite(port_print,'Volumen mes: G' + volMes +'\n\n\n');
                                sp2.serialWrite(port_print,'Dinero dia:  $' + dineroDia +'\n\n');
                                sp2.serialWrite(port_print,'Dinero sem:  $' + dineroSema +'\n\n');
                                sp2.serialWrite(port_print,'Dinero mes:  $' + dineroMes +'\n\n\n'); 
                    }
					client.query("SELECT MAX(id) FROM venta;", function(err,result){
                                done();
                                if(err){
                                    return console.error('error de conexion', err);
                                }else{
                                    sp2.serialWrite(port_print,'\n\n\n\n\n\n');
                                    var last_id = result.rows[0].max;
                                    //<!--inserta identificador de corte y últimos totales>
                                    client.query(sprintf("INSERT INTO cortem (ultima_venta,u_vol,u_vol_2,u_vol_3) VALUES ('%1$s','%2$s','%3$s','%4$s');",last_id,producto1,producto2,producto3), function(err,result){
                                        done();
                                        if(err){
                                            b_bd = 2;
                                            return console.error('error de conexion', err); 
                                        }
                                    });
                                }                 
                            }); 
				        }
                   });
                }
          });
    }

/*
*********************************************************************************************************
*                                function rx_data_mux(data)
*
* Description : Se activa cada vez que llega una trama valida del mux y ejecuta el caso segun el comando
*               
*********************************************************************************************************
*/

function rx_data_mux(data){
    if((data[0]==='M') && (data[1]==='U') && (data[2]==='X')){
        console.log('>>'+data);
        console.log('>>'+data.length);
        caso    = data[3];  /*global caso*/
        caso2   = data[4]; 
        switch (caso){                                                          
            case '0':                                                           //Caso Autorizar
            
                for(var i=19; i>=4; i--){                                       //Serial
                    serial[19-i] = data.charCodeAt(i); 
                }
                console.log('Serial: '+serial); 
                idproducto = data[20];                                          //Id Producto
                console.log('Id Producto: '+idproducto);
                for(i=21; i<25; i++){                                       //Id Estacion
                    idestacion[i-21] = data.charCodeAt(i); 
                }
                console.log('Id Estacion: '+idestacion);
                for(i=25; i<30; i++){                                       //Precio
                    precio[i-25] = data.charCodeAt(i); 
                }  
                console.log('Precio: '+precio);
                tipopreset = data[30];                             /*global tipopreset*/             //Tipo preset
                console.log('Tipo Preset: '+tipopreset);
                for(i=31; i<38; i++){                                       //Preset
                    preset[i-31] = data.charCodeAt(i); 
                }  
                console.log('Preset: '+preset);  
                for(i=44; i>=38; i--){                                      //km
                    km[44-i] = data.charCodeAt(i); 
                } 
                console.log('Km: '+km);                 
                cara = data[45];
                console.log('Cara: '+cara);
                if(permite == 0){
                    sp.serialWrite(port_mux,'BBB');           //En caso de venta incompleta
                    sp.serialWrite(port_mux,'E');             // No permite autorizar
                    sp.serialWrite(port_mux,String(cara));
                    sp.serialWrite(port_mux,'1');             //Limpia estado del mux e inicia pantalla
                    sp2.serialWrite(port_print,'\n\nCierre turno\npara iniciar venta.\n\n\n\n\n\n\n\n\n\n\n');
                    sp.serialWrite(port_mux,'*');
                }else{
                    var a = sprintf(url_auto+"/rest/Authorize/%1$s/%2$s/%3$s/%4$s/%5$s/%6$s/%7$s", serial, idproducto, idestacion, precio, tipopreset, preset, km);
                    console.log('>>'+a);
                    sp.serialWrite(port_mux,'OK');
                    rest_auto();
                }
            break;  
            
            case '1':                                                           //Caso Guardar Venta   
                cara = data[4];                                                 //Cara
                console.log('Cara: '+cara);
                idproducto = data[5];                                           //Id Producto
                console.log('Id Producto: '+idproducto); 
                for(i=6; i<13; i++){                                        //Volumen
                    volumen[i-6] = data.charCodeAt(i);
                }
                console.log('Volumen: '+volumen);  
                for(i=13; i<20; i++){                                       //Dinero
                    dinero[i-13] = data.charCodeAt(i); 
                }  
                console.log('Dinero: '+dinero);
                for(i=20; i<25; i++){                                       //Precio
                    precio[i-20] = data.charCodeAt(i); 
                }  
                console.log('Precio: '+precio); 
                for(i=25; i<29; i++){                                       //Id Estacion
                    idestacion[i-25] = data.charCodeAt(i); 
                }                 
                console.log('Id Estacion: '+idestacion);               
                for(i=44; i>=29; i--){                                      //Serial
                    serial[44-i] = data.charCodeAt(i); 
                }
                console.log('Serial: '+serial); 
                for(i=51; i>=45; i--){                                      //id Venta
                    id_venta[51-i] = data.charCodeAt(i); 
                }
                console.log('id_venta: '+id_venta);
                for(i=58; i>=52; i--){                                      //km
                    km[58-i] = data.charCodeAt(i); 
                }  
                console.log('Km: '+km); 
                console.log('Id Autorizacion: '+autorizacion);
                var f = new Date();
                fecha = f.getDate() + "-" + (f.getMonth() +1) + "-" + f.getFullYear() + ' ' + f.getHours() + '_' + f.getMinutes();
                console.log('Fecha: '+fecha);
                sp.serialWrite(port_mux,'OK');
                var n_id = idestacion + id_venta;
                var b = sprintf(url_save+"/rest/UploadSale/%1$s/%2$s/%3$s/%4$s/%5$s/%6$s/%7$s/%8$s/%9$s/%10$s/%11$s/%12$s", cara, idproducto, volumen, dinero, precio, idestacion, serial, autorizacion, n_id, km, fecha, fecha);
                console.log('>>'+b);
                console.log(n_id);
                rest_sale();                
            break;
            
            case '2':                                                           //Caso corte manual
                 for(i=15; i>=3; i--){                                       //Primer producto
                    producto1[15-i] = data.charCodeAt(i); 
                 }
                console.log('Producto 1: '+producto1);
                
                for(i=39; i>27; i--){                                       //Segundo producto
                    producto2[39-i] = data.charCodeAt(i); 
                }
                console.log('Producto 2: '+producto2);
                for(i=63; i>=52; i--){                                       //Tercer producto
                    producto3[63-i] = data.charCodeAt(i); 
                }  
                console.log('Producto 3: '+producto3);
                corte_manual();
                sp.serialWrite(port_mux,'OK');
                console.log('OK'); 
            break;   
            
            case '3':
                sp2.serialWrite(port_print,'****** Copia ******\n'); /// impresión de copia de venta
                print_venta();
            break;
            
           case '4':
			id_p1 = 0;
			id_p2 = 0;
			id_p3 = 0;   //Opción de configuración de productos
			id_p4 = 0;
			idenproducto1 = 0;
            idenproducto2 = 0;
            idenproducto3 = 0;
                switch (caso2){         //Asignación de nombres de productos y mangueras según trama
                    case 'D':
                        n_producto1 = 'Diesel';
                        id_p1 = 1;
                        idenproducto1 = 1;
                        var grado = data[5];
						switch (grado){             
							case '0':
							n_producto2 = 'No Presente';
							n_producto3 = 'No Presente';
							break;
							case 'C':
							id_p2 = 2;
							n_producto2 = 'Corriente';
							idenproducto2 = 2;
							break;
							case 'E':
							id_p3 = 2;
							n_producto2 = 'Extra';
							idenproducto2 = 3;
							break;
							case 'S':
							n_producto2 = 'S Diesel';
							idenproducto2 = 4;
							id_p4 = 2;
							break;
						}
						grado = data[6];
						switch (grado){
							case '0':
							n_producto3 = 'No Presente';
							break;
							case 'C':
							n_producto3 = 'Corriente';
							idenproducto3 = 2;
							id_p2 = 3;
							break;
							case 'E':
							n_producto3 = 'Extra';
							idenproducto3 = 3;
							id_p3 = 3;
							break;
							case 'S':
							n_producto3 = 'S Diesel';
							idenproducto3 = 4;
							id_p4 = 3;
							break;
						}
                        
                         pg.connect(conString, function(err, client, done){
                         if(err){
                                b_bd = 1;
								return console.error('error de conexion 1', err);                                
                         }else{
                            client.query(sprintf("UPDATE productos SET diesel='%1$s', corriente = '%2$s', extra = '%3$s', s_diesel ='%4$s' ",id_p1,id_p2,id_p3,id_p4), function(err,result){
                            done();
                            if(err){
                                b_bd = 1;
								return console.error('error de conexion 2', err);                            
                            }else{
                                b_bd = 0;
                            } 
                                
                            });
                         }
                         });
                    break;
                    
                    case 'C':
                        n_producto1 = 'Corriente';
                        id_p2 =1;
                        idenproducto1 = 2;
						grado = data [5];
                        switch (grado){
							case '0':
							n_producto2 = 'No Presente';
							n_producto3 = 'No Presente';
							break;
							case 'D':
							id_p1 = 2;
							idenproducto2 = 1;
							n_producto2 = 'Diesel';
							break;
							case 'E':
							n_producto2 ='Extra';
							idenproducto2 = 3;
							id_p3 = 2;
							break;
							case 'S':
							n_producto2 = 'S Diesel';
							idenproducto2 = 4;
							id_p4 = 2;
							break;
						}
						grado = data[6];
						switch (grado){
							case '0':
							n_producto3 = 'No Presente';
							break;
							case 'D':
							id_p1 = 3;
							n_producto3 = 'Diesel';
							idenproducto3 = 1;
							break;
							case 'E':
							n_producto3 = 'Extra';
							idenproducto3 = 3;
							id_p3 = 3;
							break;
							case 'S':
							n_producto3 = 'S Diesel';
							idenproducto3 = 4;
							id_p4 = 3;
							break;
						}
                        
                         pg.connect(conString, function(err, client, done){
                         if(err){
                             b_bd = 1;
                             return console.error('error de conexion 1', err);
                         }else{
                            client.query(sprintf("UPDATE productos SET diesel='%1$s', corriente = '%2$s', extra = '%3$s', s_diesel ='%4$s' ",id_p1,id_p2,id_p3,id_p4), function(err,result){
                            done();
                            if(err){
                                b_bd = 1;
                                return console.error('error de conexion 2', err);
                            }else{
                                b_bd = 0;
                            } 
                            });
                         }
                         });
                       
                        
                    break;
                    
                    case 'E':
                        n_producto1 = 'Extra';
                        id_p3 = 1;
                        idenproducto1 = 3;
						grado = data [5];
                        switch (grado){
							case '0':
							n_producto2 = 'No Presente';
							n_producto3 = 'No Presente';
							break;
							case 'C':
							id_p2 = 2;
							n_producto2 = 'Corriente';
							idenproducto2 = 2;
							break;
							case 'D':
							id_p1 = 2;
							n_producto2 = 'Diesel';
							idenproducto2 = 1;
							break;
							case 'S':
							n_producto2 = 'S Diesel';
							idenproducto2 = 4;
							id_p4 = 2;
							break;
						}
						grado = data[6];
						switch (grado){
							case '0':
							n_producto3 = 'No Presente';
							break;
							case 'C':
							n_producto3 = 'Corriente';
							idenproducto3 = 2;
							id_p2 = 3;
							break;
							case 'D':
							n_producto3 = 'Diesel';
							idenproducto3 = 1;
							id_p1 = 3;
							break;
							case 'S':
							n_producto3 = 'S Diesel';
							idenproducto3 = 4;
							id_p4 = 3;
							break;
						}
                        
                         pg.connect(conString, function(err, client, done){
                         if(err){
							    b_bd = 1;
                                return console.error('error de conexion 1', err);                                
                         }else{
                            client.query(sprintf("UPDATE productos SET diesel='%1$s', corriente = '%2$s', extra = '%3$s', s_diesel ='%4$s' ",id_p1,id_p2,id_p3,id_p4), function(err,result){
                            done();
                            if(err){
								b_bd = 1;
                                return console.error('error de conexion 2', err);                                
                            }else{
                                b_bd = 0;
                            } 
                            });
                         }
                         });
                    break;
                    
                    case 'S':
                        n_producto1 = 'S Diesel';
                        id_p4 = 1;
                        idenproducto1 = 4;
                        grado = data [5];
                        switch (grado){
							case '0':
							n_producto2 = 'No Presente';
							n_producto3 = 'No Presente';
							break;
							case 'C':
							id_p2 = 2;
							n_producto2 = 'Corriente';
							idenproducto2 = 2;
							break;
							case 'D':
							id_p1 = 2;
							n_producto2 = 'Diesel';
							idenproducto2 = 1;
							break;
							case 'E':
							n_producto2 = 'Extra';
							idenproducto2 = 3;
							id_p3 = 2;
							break;
						}
						grado = data[6];
						switch (grado){
							case '0':
							n_producto3 = 'No Presente';
							break;
							case 'C':
							n_producto3 = 'Corriente';
							idenproducto3 = 2;
							id_p2 = 3;
							break;
							case 'D':
							n_producto3 = 'Diesel';
							idenproducto3 = 1;
							id_p1 = 3;
							break;
							case 'S':
							n_producto3 = 'Extra';
							idenproducto3 = 3;
							id_p3 = 3;
							break;
						}
                        
                         pg.connect(conString, function(err, client, done){
                         if(err){							
							 b_bd = 1;
                             return console.error('error de conexion 1', err);                                
                         }else{
                             //<!--Actualiza productos asignados en la DB>
                            client.query(sprintf("UPDATE productos SET diesel='%1$s', corriente = '%2$s', extra = '%3$s', s_diesel ='%4$s' ",id_p1,id_p2,id_p3,id_p4), function(err,result){
                            done();
                            if(err){
								b_bd = 1;                                
								return console.error('error de conexion 2', err);                                
                            }else{
                                b_bd = 0;
                                productos = id_p1 + id_p2 + id_p3 + id_p4; //Cantidad de mangueras presentes
                                console.log(productos); 
                                console.log(n_producto1);
                                console.log(n_producto2);
                                console.log(n_producto3);
                            } 
                            });
                         }
                         });
                    break;
                }    
            break;
            
            case 'E':
                if(data[4] == '0'){
                    sp.serialWrite(port_mux,'BBB');
                    sp.serialWrite(port_mux,'1');
                    sp.serialWrite(port_mux,cara);
                    if(data[5] == '1'){
                        console.log('\n\nEl Equipo no recibio la programación.\nerror: 1.\n');            //No cambio el precio
                    }else if(data[5] == '2'){
                        console.log('\n\nEl Equipo no recibio la programación.\nerror: 2.\n');           //No recibio el preset
                    }
                    sp.serialWrite(port_mux,'*'); 
                }
            break;    
        }
    }
    
}


/*
*********************************************************************************************************
*                                function rest_auto()
*
* Description : LLama el servicio Web para pedir la autorizacion de una venta
*               
*********************************************************************************************************
*/

function rest_auto(){
    trycatch(function() {
        var opt_rest_autorizar = {
                url: sprintf(url_auto+"/rest/Authorize/%1$s/%2$s/%3$s/%4$s/%5$s/%6$s/%7$s", serial, idproducto, idestacion, precio, tipopreset, preset, km),                
                method: "POST",
            };  
        rest_autorizar(opt_rest_autorizar, 
        function(error, response, body) {
      
            var elements = ds.deserialize(body);
            var jsonString = ds.getJson(elements);
        
            console.log(jsonString);
        
            var result = JSON.parse(jsonString);            //Respuesta autogas en autorización
        
            cantidadAutorizada  =  String(result.aT0001responseREST.cantidadAutorizada.value);
            codigoRetorno       =  result.aT0001responseREST.codigoRetorno.value;
            idproducto          =  result.aT0001responseREST.idproducto.value;
            numeroAutorizacion  =  result.aT0001responseREST.numeroAutorizacion.value;
            retorno             =  result.aT0001responseREST.retorno.value;
            tipoConvenio        =  result.aT0001responseREST.tipoConvenio.value;
            tipoRetorno         =  result.aT0001responseREST.tipoRetorno.value;
            trama               =  result.aT0001responseREST.trama.value;
            valorConvenio       =  String(result.aT0001responseREST.valorConvenio.value);
            autorizacion        =  String(numeroAutorizacion);
            autorizaMux();
            console.log("Termina post");
        });
    }, function(err) {                              //error en el envio de datos
        console.log(err.stack);
        console.log("Termina post con error");
        sp.serialWrite(port_mux,'BBB');
        sp.serialWrite(port_mux,'E');
        sp.serialWrite(port_mux,String(cara));
        sp.serialWrite(port_mux,'1');                         //Limpia estado del mux e inicia pantalla
        sp.serialWrite(port_mux,'*');
        sp2.serialWrite(port_print,'\n\nLos datos no se lograron\nenviar al servidor.\n\n\n\n\n\n\n');
    });
}
/*
*********************************************************************************************************
*                                function save_auto()
*
* Description : Guarda el numero de Autorizacion de Autogas
*               
*********************************************************************************************************
*/
function save_auto(){
    if(codigoRetorno==0){
        pg.connect(conString, function(err, client, done){
            if(err){
                b_bd = 1;
                return console.error('error de conexion 1', err);
            }else{
                client.query(sprintf("INSERT INTO venta (autorizacion) VALUES ('%1$s');",autorizacion), function(err,result){
                    done();
                    if(err){
                        b_bd = 1;
                        return console.error('error de conexion 2', err);
                    }else{
                        b_bd = 0;
                    }                 
                });   
            }
        });
    }
}

/*
*********************************************************************************************************
*                                function autorizaMux()
*
* Description : Envia los datos para autorizar el surtidor
*               
*********************************************************************************************************
*/
function autorizaMux(){
    sp.serialWrite(port_mux,'BBB');                                       //Encabezado
    console.log("BBB");
    sp.serialWrite(port_mux,'0');                                         
    console.log('0');
    console.log("Envia datos de autorizacion");
    sp.serialWrite(port_mux,String(cara));                                //Cara
    console.log("Cara: "+cara);
    if(codigoRetorno==0){                                       //Si no hay error
        sp.serialWrite(port_mux,String(idproducto));                      //Id Producto
        console.log("Id Producto: "+idproducto);                                        
        console.log("Precio: ");                                //Precio
        if(tipoConvenio == 1){                                  //Convenio: el mismo precio de estacion
            for(var i=1; i<=4; i++){
                sp.serialWrite(port_mux,'0');
                console.log('0');
            }
            sp.serialWrite(port_mux,'F'); 
            console.log('F');
        }
        if(tipoConvenio == 2){                                  //Convenio: Descuento en pesos
            valorConvenio = String(parseInt(precio) - parseInt(valorConvenio));
            for(i=valorConvenio.length; i<=4; i++){
                sp.serialWrite(port_mux,'0');
                console.log('0');
            }
            sp.serialWrite(port_mux,valorConvenio); 
            console.log(valorConvenio);            
        }
        if(tipoConvenio == 3){                                  //Convenio: Descuento en %
            valorConvenio = String(Math.round((parseInt(precio) * parseInt(valorConvenio)) / 100));
            for(i=valorConvenio.length; i<=4; i++){
                sp.serialWrite(port_mux,'0');
                console.log('0');
            }
            sp.serialWrite(port_mux,valorConvenio); 
            console.log(valorConvenio);            
        }        
        if(tipoConvenio == 4){                                  //Convenio: Enviaron Precio
            for(i=valorConvenio.length; i<=4; i++){
                sp.serialWrite(port_mux,'0');
                console.log('0');
            }
            sp.serialWrite(port_mux,valorConvenio); 
            console.log(valorConvenio);            
        }
        if(tipoRetorno==1){//si es dinero cambia el tipo de valor float a int///////////////////////////////////////////////////////////
            cantidadAutorizada = parseInt(cantidadAutorizada);
        }
        cantidadAutorizada = String(cantidadAutorizada); //envia datos en string a la web
        for(i=cantidadAutorizada.length; i<=6; i++){
            sp.serialWrite(port_mux,'0');
            console.log('0');
        } 
        sp.serialWrite(port_mux,cantidadAutorizada);
        console.log('Cantidad Autorizada: '+cantidadAutorizada);
        sp.serialWrite(port_mux,String(tipoRetorno));
        console.log('Tipo de Preset: '+tipoRetorno);       
    }
    else{
        sp.serialWrite(port_mux,'N');

        sp2.serialWrite(port_print,'\n\nERROR:\n ');//mod ayer
        switch(codigoRetorno){
            case 0:                                     //Códigos de error de autogas para negar despacho
               sp2.serialWrite(port_print,'\nÉXITO\n'); 
            break; 
            case 100:
               sp2.serialWrite(port_print,'\nEL SERIAL DEL VEHICULO  NO EXISTE\n'); 
            break; 
            case 200:
               sp2.serialWrite(port_print,'\nPARAMETROS DE ENTRADA\n'); 
               sp2.serialWrite(port_print,'\nINCORRECTOS\n');                
            break; 
            case 300:
               sp2.serialWrite(port_print,'\nERROR DESCONOCIDO\n'); 
            break; 
            case 400:
               sp2.serialWrite(port_print,'\nCUENTA SIN CUPO\n'); 
            break; 
            case 501:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE VOLUMEN AL DIA\n'); 
            break; 
            case 502:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE VOLUMEN A LA\n'); 
               sp2.serialWrite(port_print,'\nSEMANA\n');               
            break; 
            case 503:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE VOLUMEN AL\n'); 
               sp2.serialWrite(port_print,'\nMES\n');                
            break; 
            case 601:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE VISITAS AL DIA\n'); 
            break; 
            case 602:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE VISITAS A LA\n'); 
               sp2.serialWrite(port_print,'\nSEMANA\n');               
            break; 
            case 603:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE VISITAS AL MES\n'); 
            break; 
            case 701:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE DINERO AL DIA\n'); 
            break; 
            case 702:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE DINERO A LA\n'); 
               sp2.serialWrite(port_print,'\nSEMANA\n');                
            break; 
            case 703:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE DINERO AL MES\n'); 
            break; 
            case 801:
               sp2.serialWrite(port_print,'\nVEHICULO NO PUEDE TANQUEAR EN\n'); 
               sp2.serialWrite(port_print,'\nESTA HORA\n'); 
            break; 
            case 901:
               sp2.serialWrite(port_print,'\nVEHICULO NO PUEDE TANQUEAR EN \n');
               sp2.serialWrite(port_print,'\nESTA EDS\n'); 
            break; 
            case 1001:
               sp2.serialWrite(port_print,'\nVEHICULO NO PUEDE TANQUEAR EL\n'); 
               sp2.serialWrite(port_print,'\nPRODUCTO SELECCIONADO\n');                
            break; 
            case 1101:
               sp2.serialWrite(port_print,'\nLA CUENTA SE ENCUENTRA EN\n'); 
               sp2.serialWrite(port_print,'\nESTADO BLOQUEADO\n');                
            break; 
            case 1102:
               sp2.serialWrite(port_print,'\nLA CUENTA  SE ENCUENTRA  EN UNA\n'); 
               sp2.serialWrite(port_print,'\nFECHA VENCIDA\n');                
            break; 
            case 1201:
               sp2.serialWrite(port_print,'\nEL VEHICULO SE ENCUENTRA EN\n'); 
               sp2.serialWrite(port_print,'\nESTADO BLOQUEADO\n'); 
            break; 
            case 1302:
               sp2.serialWrite(port_print,'\nLA EDS NO ES VALIDA\n'); 
            break; 
            case 1401:
               sp2.serialWrite(port_print,'\nEL KILOMETRAJE INGRESADO ES\n'); 
               sp2.serialWrite(port_print,'\nINFERIOR AL ULTIMO INGRESADO\n');                
            break; 
            case 1501:
               sp2.serialWrite(port_print,'\nEL VOLUMEN SUPERA LA CAPACIDAD\n'); 
               sp2.serialWrite(port_print,'\nDEL TANQUE DEL VEHICULO\n'); 
            break;             
        }
        sp2.serialWrite(port_print,'\nCODIGO DE ERROR: ');
        sp2.serialWrite(port_print,String(codigoRetorno)); 
        sp2.serialWrite(port_print,'\n\n');
        //mod ayer
    }
    sp.serialWrite(port_mux,'*');
    save_auto();
}
/*
*********************************************************************************************************
*                                function save_sale()
*
* Description : Guarda la venta en la base de datos
*               
*********************************************************************************************************
*/
function save_sale(){
    pg.connect(conString, function(err, client, done){                  //conectar a la base de datos
        if(err){
            return console.error('error de conexion', err);
        }else{
            volumen[3]=46;
             var vol_tabla = parseFloat(volumen);
            client.query("SELECT MAX(id) FROM venta;", function(err,result){        //consulto maximo id de venta
                done();
                if(err){
                    b_bd = 2;
                    return console.error('error de conexion', err);
                }else{
                    console.log(result.rows[0].max);
                    var last_id = result.rows[0].max;           //Cargo el maximo id de venta
                    if(codigoError == '0' && error_local=='0'){ //Cargar dato de si fue enviada o no la venta
                        b_enviada = 'TRUE';
                        imp='0';
                    }else{
                       b_enviada = 'FALSE';
                       imp ='1';
                    }
                    console.log(id_venta);
                     var n_id = idestacion + id_venta;
                    client.query(sprintf("UPDATE venta SET (id_venta, id_estacion, serial, km, cara, producto, precio, dinero, volumen, fecha, enviada) = ('%1$s','%2$s', '%3$s', '%4$s', '%5$s', '%6$s', '%7$s', '%8$s', '%9$s', '%10$s','%11$s') WHERE id='%12$s'", n_id, idestacion, serial, km, cara, idproducto, precio, dinero, vol_tabla, fecha, b_enviada,last_id), function(err,result){
                    
                        done();
                        if(err){
                            b_bd = 2;
                            print_venta(); //Imprime venta sin insertar en la DB
                            return console.error('error de conexion', err); 
                        }else{
                            print_venta(); //Imprime venta insertada en la DB
                            b_bd = 0;
                        }
                    });
                }                 
            });  
        }
    }); 
}

/*
*********************************************************************************************************
*                                function rest_sale()
*
* Description : LLama el servicio Web para guardar una venta
*               
*********************************************************************************************************
*/

function rest_sale(){
    var n_id = idestacion + id_venta;
    trycatch(function() {
        var opt_rest_venta = {
				
                url: sprintf(url_save+"/rest/UploadSale/%1$s/%2$s/%3$s/%4$s/%5$s/%6$s/%7$s/%8$s/%9$s/%10$s/%11$s/%12$s", cara, idproducto, volumen, dinero, precio, idestacion, serial, autorizacion, n_id, km, fecha, fecha), /*global autorizacion*//*global idestacion*/
                method: "POST",
            };   
            console.log(n_id);
        rest_venta(opt_rest_venta, 
        function(error, response, body) {
          
      
            var elements2 = ds.deserialize(body);
            var jsonString2 = ds.getJson(elements2);
        
            console.log(jsonString2);
        
            var result2 = JSON.parse(jsonString2);
        
            codigoError        =  result2.cV0001responseREST.codError.value;
            dineroDia          =  result2.cV0001responseREST.dineroDia.value;           //Resultados enviados por Autogas
            dineroMes          =  result2.cV0001responseREST.dineroMes.value;
            dineroSema         =  result2.cV0001responseREST.dineroSema.value;
            imprime_contadores =  String(result2.cV0001responseREST.imprimeContador.value);              
            imprime_saldo      =  String(result2.cV0001responseREST.imprimeSaldo.value);
            nombreCuenta       =  result2.cV0001responseREST.nombreCuenta.value;
            placa              =  result2.cV0001responseREST.placa.value;
            retorno            =  result2.cV0001responseREST.retorno.value;
            saldo              =  String(result2.cV0001responseREST.saldo.value);
            visitasDia         =  String(result2.cV0001responseREST.visitasDia.value);
            visitasMes         =  String(result2.cV0001responseREST.visitasMes.value);
            visitasSema        =  String(result2.cV0001responseREST.visitasSema.value);
            volDia             =  String(result2.cV0001responseREST.volDia.value);
            volMes             =  String(result2.cV0001responseREST.volMes.value);
            volSema            =  String(result2.cV0001responseREST.volSema.value);
            
            console.log("Termina post");
            //b_enviada = 'TRUE';
            error_local = '0';
            save_sale();
        });
    }, function(err) {
        console.log(err.stack);
        console.log("Termina post con error");
        error_local = '1';
        b_enviada = 'FALSE'; 
        if(imp =='0'){
            sp2.serialWrite(port_print,'No se logró enviar al servidor\n\n'); //Informa que no se pudo subir venta a remoto
            sp2.serialWrite(port_print,'*****VENTA ALMACENADA LOCAL*****\n\n');
            save_sale();    /// Guarda venta cuando no hay conexión a servidor
            
        }
    });
}

/*
*********************************************************************************************************
*                                function print_venta()
*
* Description : Envia los datos para imprimir la venta
*               
*********************************************************************************************************
*/

function print_venta(){
    console.log("IMPRIMIENDO");
    if(codigoError == '0'){
        sp.serialWrite(port_mux,'BBB');
        sp.serialWrite(port_mux,'E');
        sp.serialWrite(port_mux,String(cara));
        sp.serialWrite(port_mux,'2');                         //Gracias por su compra
        sp.serialWrite(port_mux,'*');        
        console.log("RECIBO");
        console.log('\n\n');
        sp2.serialWrite(port_print,'  '+linea1 +'\n');
        sp2.serialWrite(port_print,'   '+linea2 +'\n');
        sp2.serialWrite(port_print,'      '+nit+'\n');
        sp2.serialWrite(port_print,'      Tel: '+tel+'\n');
        sp2.serialWrite(port_print,'  '+dir+ '\n\n');
        
        var f = new Date();
		sp2.serialWrite(port_print,'Fecha:' + String(f.getDate() + "-" + (f.getMonth() + 1) + "-" + f.getFullYear() + ' ' + f.getHours() + ':' + f.getMinutes()) + '\n\n');                                                      
        /*sp2.serialWrite(port_print,'Fecha : '+fecha+'\n\n');*/
        sp2.serialWrite(port_print,'Numero: ' +idestacion+id_venta+ '\n');
        sp2.serialWrite(port_print,'Empresa:\n\n');
        sp2.serialWrite(port_print,String(nombreCuenta) + '\n');
        sp2.serialWrite(port_print,'Serial:\n\n');
        sp2.serialWrite(port_print,serial + '\n\n');
        if(imprime_contadores == 1){         
            sp2.serialWrite(port_print,'Visitas: ' + visitasDia + 'd  ' + visitasSema + 's  ' + visitasMes + 'm  ' + '\n\n\n');
            sp2.serialWrite(port_print,'Volumen dia: G' + volDia +'\n');
            sp2.serialWrite(port_print,'Volumen sem: G' + volSema +'\n');
            sp2.serialWrite(port_print,'Volumen mes: G' + volMes +'\n\n');
            sp2.serialWrite(port_print,'Dinero dia:  $' + dineroDia +'\n');
            sp2.serialWrite(port_print,'Dinero sem:  $' + dineroSema +'\n');
            sp2.serialWrite(port_print,'Dinero mes:  $' + dineroMes +'\n\n'); 
        }
        sp2.serialWrite(port_print,'Placa: ' + placa +'\n');
        sp2.serialWrite(port_print,'Km   : ' + km +'\n');
        if(imprime_saldo == 1){        
            sp2.serialWrite(port_print,'Saldo: $' + saldo + '\n\n');
        }
        sp2.serialWrite(port_print,'Posicion: ' + cara + '\n');
        sp2.serialWrite(port_print,'Producto: ');
        switch(idproducto){
            case '1':
               sp2.serialWrite(port_print,'Diesel\n'); 
            break;
            
            case '2':
               sp2.serialWrite(port_print,'Corriente\n'); 
            break; 
            
            case '3':
               sp2.serialWrite(port_print,'Extra\n'); 
            break; 
            
            case '4':
               sp2.serialWrite(port_print,'Supreme Diesel\n'); 
            break;                 
        }
        var precio1 = parseFloat(precio);
        sp2.serialWrite(port_print,'PPU     : $' + String(precio1) + '\n');
        volumen[3]=46;
        var volumen1 = parseFloat(volumen);
        sp2.serialWrite(port_print,'Volumen : G' + volumen1 + '\n');
        var dinero1 = parseFloat(dinero);
        sp2.serialWrite(port_print,'Dinero  : $' + String(dinero1) + '\n\n\n');
        sp2.serialWrite(port_print,'Firma :'+ '\n\n');
        sp2.serialWrite(port_print,'       --------------------'+ '\n\n');
        sp2.serialWrite(port_print,'Cedula:' + '\n');
        sp2.serialWrite(port_print,'       --------------------'+ '\n\n');
        sp2.serialWrite(port_print,footer+ '\n');
        sp2.serialWrite(port_print,'\n\n\n\n\n\n\n');   
    }
    else{
        sp.serialWrite(port_mux,'BBB');
        sp.serialWrite(port_mux,'E');
        sp.serialWrite(port_mux,String(cara));
        sp.serialWrite(port_mux,'3');                         //Error de Operacion
        sp.serialWrite(port_mux,'*');        
        sp2.serialWrite(port_print,'\n\nERROR: \n');
        
        
        

        switch(codigoError){
            case 0:                                         //Códigos de error enviados por Autogas
               sp2.serialWrite(port_print,'\nÉXITO\n'); 
            break; 
            case 100:
               sp2.serialWrite(port_print,'\nEL SERIAL DEL VEHICULO  NO EXISTE\n'); 
            break; 
            case 200:
               sp2.serialWrite(port_print,'\nPARAMETROS DE ENTRADA\n'); 
               sp2.serialWrite(port_print,'\nINCORRECTOS\n');                
            break; 
            case 300:
               sp2.serialWrite(port_print,'\nERROR DESCONOCIDO\n'); 
            break; 
            case 400:
               sp2.serialWrite(port_print,'\nCUENTA SIN CUPO\n'); 
            break; 
            case 501:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE VOLUMEN AL DIA\n'); 
            break; 
            case 502:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE VOLUMEN A LA\n'); 
               sp2.serialWrite(port_print,'\nSEMANA\n');               
            break; 
            case 503:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE VOLUMEN AL\n'); 
               sp2.serialWrite(port_print,'\nMES\n');                
            break; 
            case 601:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE VISITAS AL DIA\n'); 
            break; 
            case 602:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE VISITAS A LA\n'); 
               sp2.serialWrite(port_print,'\nSEMANA\n');               
            break; 
            case 603:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE VISITAS AL MES\n'); 
            break; 
            case 701:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE DINERO AL DIA\n'); 
            break; 
            case 702:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE DINERO A LA\n'); 
               sp2.serialWrite(port_print,'\nSEMANA\n');                
            break; 
            case 703:
               sp2.serialWrite(port_print,'\nVEHICULO NO TIENE DINERO AL MES\n'); 
            break; 
            case 801:
               sp2.serialWrite(port_print,'\nVEHICULO NO PUEDE TANQUEAR EN\n'); 
               sp2.serialWrite(port_print,'\nESTA HORA\n'); 
            break; 
            case 901:
               sp2.serialWrite(port_print,'\nVEHICULO NO PUEDE TANQUEAR EN \n');
               sp2.serialWrite(port_print,'\nESTA EDS\n'); 
            break; 
            case 1001:
               sp2.serialWrite(port_print,'\nVEHICULO NO PUEDE TANQUEAR EL\n'); 
               sp2.serialWrite(port_print,'\nPRODUCTO SELECCIONADO\n');                
            break; 
            case 1101:
               sp2.serialWrite(port_print,'\nLA CUENTA SE ENCUENTRA EN\n'); 
               sp2.serialWrite(port_print,'\nESTADO BLOQUEADO\n');                
            break; 
            case 1102:
               sp2.serialWrite(port_print,'\nLA CUENTA  SE ENCUENTRA  EN UNA\n'); 
               sp2.serialWrite(port_print,'\nFECHA VENCIDA\n');                
            break; 
            case 1201:
               sp2.serialWrite(port_print,'\nEL VEHICULO SE ENCUENTRA EN\n'); 
               sp2.serialWrite(port_print,'\nESTADO BLOQUEADO\n'); 
            break; 
            case 1302:
               sp2.serialWrite(port_print,'\nLA EDS NO ES VALIDA\n'); 
            break; 
            case 1401:
               sp2.serialWrite(port_print,'\nEL KILOMETRAJE INGRESADO ES\n'); 
               sp2.serialWrite(port_print,'\nINFERIOR AL ULTIMO INGRESADO\n');                
            break; 
            case 1501:
               sp2.serialWrite(port_print,'\nEL VOLUMEN SUPERA LA CAPACIDAD\n'); 
               sp2.serialWrite(port_print,'\nDEL TANQUE DEL VEHICULO\n'); 
            break;             
        }
        if(codigoError == '2002')  //Impresión de venta autorizada 
        {                          //Repetida en servidor
        imp ='0';   
        sp2.serialWrite(port_print,'CODIGO DE ERROR: ');
        sp2.serialWrite(port_print,String(codigoError)); 
        sp2.serialWrite(port_print,'\n');
        sp2.serialWrite(port_print,'  VENTA YA ENVIADA A SERVIDOR \n\n');
        sp2.serialWrite(port_print,'  '+linea1 +'\n');
        sp2.serialWrite(port_print,'   '+linea2 +'\n');
        sp2.serialWrite(port_print,'      '+nit+'\n');
        sp2.serialWrite(port_print,'      Tel: '+tel+'\n');
        sp2.serialWrite(port_print,'  '+dir+ '\n\n');
        sp2.serialWrite(port_print,'Numero: ' +id_venta+ '\n'); /*global id_venta*/
        f = new Date();
		sp2.serialWrite(port_print,'Fecha:' + String(f.getDate() + "-" + (f.getMonth() + 1) + "-" + f.getFullYear() + ' ' + f.getHours() + ':' + f.getMinutes()) + '\n\n');                                                      
        /*sp2.serialWrite(port_print,'Fecha : '+fecha+'\n\n');*/
        sp2.serialWrite(port_print,'Serial:\n\n');
        sp2.serialWrite(port_print,serial + '\n\n'); /*global serial*/
        codigoError = '0';
        b_enviada = 'TRUE';
        if(imprime_contadores == 1){         
            sp2.serialWrite(port_print,'Visitas: ' + visitasDia + 'd  ' + visitasSema + 's  ' + visitasMes + 'm  ' + '\n\n\n');
            sp2.serialWrite(port_print,'Volumen dia: G' + volDia +'\n');
            sp2.serialWrite(port_print,'Volumen sem: G' + volSema +'\n');
            sp2.serialWrite(port_print,'Volumen mes: G' + volMes +'\n\n');
            sp2.serialWrite(port_print,'Dinero dia:  $' + dineroDia +'\n');
            sp2.serialWrite(port_print,'Dinero sem:  $' + dineroSema +'\n');
            sp2.serialWrite(port_print,'Dinero mes:  $' + dineroMes +'\n\n'); 
        }
        sp2.serialWrite(port_print,'Km   : ' + km +'\n');/*global km*/
        if(imprime_saldo == 1){        
            sp2.serialWrite(port_print,'Saldo: $' + saldo + '\n\n');
        }
        sp2.serialWrite(port_print,'Posicion: ' + cara + '\n'); /*global cara*/
        sp2.serialWrite(port_print,'Producto: ');
        switch(idproducto){
            case '1':
               sp2.serialWrite(port_print,'Diesel\n'); 
            break;
            
            case '2':
               sp2.serialWrite(port_print,'Corriente\n'); 
            break; 
            
            case '3':
               sp2.serialWrite(port_print,'Extra\n'); 
            break; 
            
            case '4':
               sp2.serialWrite(port_print,'Supreme Diesel\n'); 
            break;                 
        }
        precio1 = parseFloat(precio);/*global precio*/
        sp2.serialWrite(port_print,'PPU     : $' + String(precio1) + '\n');
        volumen[3]=46;
        volumen1 = parseFloat(volumen); /*global volumen*/
        sp2.serialWrite(port_print,'Volumen : G' + volumen1 + '\n');
        dinero1 = parseFloat(dinero); /*global dinero*/
        sp2.serialWrite(port_print,'Dinero  : $' + String(dinero1) + '\n\n\n');
        sp2.serialWrite(port_print,'Firma :'+ '\n\n');
        sp2.serialWrite(port_print,'       --------------------'+ '\n\n');
        sp2.serialWrite(port_print,'Cedula:' + '\n');
        sp2.serialWrite(port_print,'       --------------------'+ '\n\n');
        sp2.serialWrite(port_print,footer+ '\n');
        sp2.serialWrite(port_print,'\n\n\n\n\n\n\n'); 
        }
        //mod ayer
    } 
    console.log("FIN IMPRIMIENDO");
}

/*
*********************************************************************************************************
*                                function watchful()
*
* Description : Revisa los estados del Beagle para realizar reintentos o peticiones al MUX
*               
*********************************************************************************************************
*/
function watchful(){
    console.log("Vigilando");
    var f = new Date();
    if((f.getHours()=='11')&&(f.getMinutes()=='37')&&(corte_ok==0)){
        sp2.serialWrite(port_print,'MOMENTO DE CORTE\n');
        sp2.serialWrite(port_print,'REALICE CIERRE DE TURNO\n');
        sp2.serialWrite(port_print,'PARA INICIAR VENTA\n\n\n\n\n\n');              //A la hora programada se ejecuta la funcion para obligar a corte
        sp2.serialWrite(port_print,'*** CORTE PROGRAMADO***\n');
        permite  = 0;
        corte_ok = 1;
        console.log('Pregunta');
    }
    else{
        corte_ok=0;
    }
    if (b_enviada == 'FALSE'){
       rest_sale(); 
    }
}

/*
*********************************************************************************************************
*                                    Metodos Principales
*********************************************************************************************************
*/

sp.serialOpen(port_mux, config_port_mux, abrir);    //Abre la comunicacion con el mux
sp2.serialOpen(port_print,config_port_print,abrir_print);                      //Abre la comunicacion con el mux
setInterval(watchful, 2000);                       //Revisa el estado de las banderas










