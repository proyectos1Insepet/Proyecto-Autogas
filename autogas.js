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
var rest_venta      = require("request");
var rest_autorizar  = require("request");
var sp              = require("serialport");
var sp2             = require("serialport");
var pg              = require('pg');
/*
*********************************************************************************************************
*                                    DECLARACION DE VARIABLES
*********************************************************************************************************
*/
var port_mux          = '/dev/ttyO4';
var config_port_mux   = {baudrate: 9600, parser: sp.parsers.readline("*")};
var muxport           = new sp.SerialPort(port_mux,config_port_mux);

var port_print        = '/dev/ttyO1';
var config_port_print = {baudrate: 115200, parser: sp2.parsers.readline("*")};// 115200
var printport           = new sp2.SerialPort(port_print,config_port_print);
     
var conString         = "postgrest://db_admin:12345@localhost:5432/autogas";
/*****************Variables para el flujo***************************/
var b_enviada;
var corte_ok;
/**************Variables para la autorizacion***********************/
var cantidadAutorizada;
var codigoRetorno;
var direccion;
var telefono;
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
var imp2;
var SinImpresion;
var printrec;
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
var n_producto1b;
var n_producto2b;
var n_producto3b;
var idenproducto1;
var idenproducto2;
var idenproducto3;
var idenproducto1b;
var idenproducto2b;
var idenproducto3b;
var productos;
var productosB;
var id_p1;
var id_p2;
var id_p3;
var id_p4;
var id_p1b;
var id_p2b;
var id_p3b;
var id_p4b;
var permite;
var permite2;
var linea1;
var linea2;
var nit;
var tel;
var dir;
var footer;
var idestacionefectivo;
var url_auto;
var url_save;
var ventaPendiente;
var ventaPendiente2;
var enviaRecuperada;
var idVentaRecuperada;
var vol_tabla;
var recuperaProducto;
var recuperaProducto2;
var subeInternet;
var subeInternet2;
var dineroRecuperado;
var enable_count;
var contador;
var saveEfectivo;
var insertado;
var caraint;
var serialint;
var precioint;
var kmint;
var idestacionint;
var volumenint;
var dineroint;
var id_ventaint;
var idproductoint;
var autorizacionint;
var fechaint;
var nombreCuentaint;
var telefonoint;
var direccionint;
var placaint;
var printInt;
var printInt2;

/********************Arreglos**************************************/            

serialrec       = new Buffer(16); /*global serialrec*/
precio          = new Buffer(5); 
preciorec       = new Buffer(5);  /*global preciorec*/
preset          = new Buffer(7); /*global preset*/
km              = new Buffer(7);
idestacion      = new Buffer(4);
volumen         = new Buffer(7);
dinero          = new Buffer(7);
dinerorec       = new Buffer(7); /*global dinerorec*/
serial          = new Buffer(16); /*global serial*/
var volumenrec      = new Buffer(7); /*global volumenrec*/
var autorizacion= new Buffer(38);
var autorizaefec= new Buffer(38);
var id_venta        = new Buffer(7);
var id_ventarec     = new Buffer(7);
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
*                                     INICIALIZACI�N DEL M�DULO                                         *
*                                                                                                       *
*   Lee la base de datos para determinar si hay ventas sin cerrar e inicializar los nombres de los      *
*   productos seg�n la �ltima configuraci�n y ultima venta                                              *
*********************************************************************************************************
*/
    
function reinicio(error){
     if (error){
       console.log(error);
     }else{
         permite = 0;
         imp  = 0;
         imp2 = 0;
         pg.connect(conString, function(err, client, done){
         if(err){             
             return console.error('error de conexion 1', err);
         }else{
             
              client.query("SELECT linea1, linea2, nit, tel, dir, footer, idestacion, url, url_save FROM recibo;", function(err,result){
                    done();
                    if(err){                        
                        return console.error('error de conexion', err);
                    }else{
                    linea1 = result.rows[0].linea1;
                    linea2 = result.rows[0].linea2;
                    nit = result.rows[0].nit;
                    tel = result.rows[0].tel;
                    dir = result.rows[0].dir;
                    footer = result.rows[0].footer;
                    idestacionefectivo = result.rows[0].idestacion;
                    url_auto = result.rows[0].url;
                    url_save = result.rows[0].url_save;
                    }
              });
             
             
                client.query(sprintf("SELECT enviada, volumen FROM venta WHERE id = (SELECT MAX(id) FROM venta WHERE cara ='1')"), function(err,result){
                	done();
                	if(err){
                	 return console.error('error seleccionar ultima venta', err);
                	}else{
                	    console.log(result.rows[0].enviada);
                		if (result.rows[0].enviada == false || result.rows[0].volumen == null){
                			printport.write('VENTA INCOMPLETA CARA 1\n');
                			printport.write('REALICE CIERRE DE TURNO\n');
                			printport.write('PARA INICIAR VENTA\n\n\n\n\n\n\n\n\n');
                			permite = 0;					
                			ventaPendiente = 1;
                		}else{
                			permite = 1;			
                			ventaPendiente = 0;
                		}
                	}
                });
                
                client.query(sprintf("SELECT enviada, volumen FROM venta WHERE id = (SELECT MAX(id) FROM venta WHERE cara ='2')"), function(err,result){
            	done();
            	if(err){
            	 return console.error('error seleccionar ultima venta', err);
            	}else{
            	    console.log(result.rows[0].enviada || result.rows[0].volumen == null);
            		if (result.rows[0].enviada == false){
            			printport.write('VENTA INCOMPLETA CARA 2\n');
            			printport.write('REALICE CIERRE DE TURNO\n');
            			printport.write('PARA INICIAR VENTA\n\n\n\n\n\n\n\n\n');
            			permite = 0;					
            			ventaPendiente2 = 1;
            		}else{
            			permite2 = 1;			
            			ventaPendiente2 = 0;
            		}
            	}
            });
            id_p1 = 0;
            id_p2 = 0;  //Posiciones de los productos
            id_p3 = 0;  //Ej id_p1 = 2  Diesel (producto 1 en posici�n 2) 
            id_p4 = 0;  // id_px = 0; no hay producto en dispensador
            idenproducto1 = 0;   // Identificador de producto seg�n manguera
            idenproducto2 = 0;   // (Diesel = 1, Corriente = 2, Extra = 3, Supreme Diesel = 4)
            idenproducto3 = 0;
            id_p1b = 0;
            id_p2b = 0;  //Posiciones de los productos
            id_p3b = 0;  //Ej id_p1 = 2  Diesel (producto 1 en posici�n 2) 
            id_p4b = 0;  // id_px = 0; no hay producto en dispensador
            idenproducto1b = 0;   // Identificador de producto seg�n manguera
            idenproducto2b = 0;   // (Diesel = 1, Corriente = 2, Extra = 3, Supreme Diesel = 4)
            idenproducto3b = 0;
            client.query(sprintf("SELECT MAX(diesel) FROM productos where id =1"), function(err,result){
            done();
            if(err){                
                return console.error('error seleccionar productos', err);
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
        client.query(sprintf("SELECT MAX(diesel) FROM productos where id =2"), function(err,result){
            done();
            if(err){                
                return console.error('error seleccionar productos', err);
            }else{
                switch (result.rows[0].max){
                    case 1:
                        n_producto1b = 'Diesel';
                        idenproducto1b = 1;
                        id_p1b = 1;
                    break;
                    
                    case 2:
                        n_producto2b = 'Diesel';
                        idenproducto2b = 1;
                        id_p1b = 2;
                    break;
                    
                    case 3:
                        n_producto3b = 'Diesel';
                        idenproducto3b = 1;
                        id_p1b = 3;
                    break;
                }
            } 
                                
        });
        
        client.query(sprintf("SELECT MAX(corriente) FROM productos where id =1"), function(err,result){
            done();
            if(err){                
                return console.error('error seleccionar productos', err);
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
        client.query(sprintf("SELECT MAX(corriente) FROM productos where id =2"), function(err,result){
            done();
            if(err){                
                return console.error('error seleccionar productos', err);
            }else{
                switch (result.rows[0].max){
                    case 1:
                        n_producto1b = 'Corriente';
                        idenproducto1b = 2;
                        id_p2b = 1;
                    break;
                    
                    case 2:
                        n_producto2b = 'Corriente';
                        idenproducto2b = 2;
                        id_p2b = 2;
                    break;
                    
                    case 3:
                        n_producto3b = 'Corriente';
                        idenproducto3b = 2;
                        id_p2b = 3;
                    break;
                }
            } 
        });
        client.query(sprintf("SELECT MAX(extra) FROM productos where id =1"), function(err,result){
            done();
            if(err){                
                return console.error('error seleccionar productos', err);
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
        client.query(sprintf("SELECT MAX(extra) FROM productos where id =2"), function(err,result){
            done();
            if(err){                
                return console.error('error seleccionar productos', err);
            }else{
                switch (result.rows[0].max){
                    case 1:
                        n_producto1b = 'Extra';
                        idenproducto1b = 3;
                        id_p3b = 1;
                    break;
                    
                    case 2:
                        n_producto2b = 'Extra';
                        idenproducto2b = 3;
                        id_p3b = 2;
                    break;
                    
                    case 3:
                        n_producto3b = 'Extra';
                        idenproducto3b = 3;
                        id_p3b = 3;
                    break;
                }
            } 
        });
        client.query(sprintf("SELECT MAX(s_diesel) FROM productos where id =1"), function(err,result){
            done();
            if(err){                
                return console.error('error seleccionar productos', err);
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
        client.query(sprintf("SELECT MAX(s_diesel) FROM productos where id =2"), function(err,result){
            done();
            if(err){                
                return console.error('error seleccionar productos', err);
            }else{
                switch (result.rows[0].max){
                    case 1:
                        n_producto1b = 'S Diesel';
                        idenproducto1b = 4;
                        id_p4b = 1;
                    break;
                    
                    case 2:
                        n_producto2b = 'S Diesel';
                        idenproducto2b = 4;
                        id_p4b = 2;
                    break;
                    
                    case 3:
                        n_producto3b = 'S Diesel';
                        idenproducto3b = 4;
                        id_p4b = 3;
                    break;
                }
                productosB = id_p1b + id_p2b + id_p3b + id_p4b; // identifica cantidad de mangueras configuradas
                console.log(id_p1b);
                console.log(id_p2b);
                console.log(id_p3b);
                console.log(id_p4b);
                console.log(productos);
                console.log(n_producto1b);
                console.log(n_producto2b);
                console.log(n_producto3b);
                console.log('P1b:'+idenproducto1b);
                console.log('P2b:'+idenproducto2b);
                console.log('P3b:'+idenproducto3b);
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
function abrir(error){
   
       corte_ok=0;
       b_enviada = 'TRUE';
       console.log('open '+port_mux);
       muxport.on('data',rx_data_mux);
       reinicio();
   
}
/*
*********************************************************************************************************
*                                    abrir_print(error)(error)
*
* Description : Abre el puerto serial para la comunicacion con la impresora
*               
*********************************************************************************************************
*/
function abrir_print(error){
   if (error){
       console.log('failed to open: '+error);
   } else{
       console.log('open '+port_print);
   }
}
/*
*********************************************************************************************************
*                                function recuperacion()
*
* Description : Imprime corte pulsado desde pantalla
*               
*********************************************************************************************************
*/
function recuperacion(){
	pg.connect(conString, function(err, client, done){
	    if(err){
            return console.error('error de conexion 1', err);
         }else{                                                           
			client.query(sprintf("SELECT MAX(CAST(tot1 AS INT)) FROM recuperacion where idpos = '%1$s';",String(cara)), function(err,result){
				done();
				if(err){				
					return console.error('error de conexion', err);
				}else{				
					total_vol_p1 = (parseFloat(producto1)/100 - parseFloat(result.rows[0].max)/100).toFixed(3); /*global producto1*/
					console.log(total_vol_p1);
					if (total_vol_p1 != 0){
					    recuperaProducto = 1;
						client.query(sprintf("UPDATE recuperacion SET tot1='%1$s' where idpos = '1';",producto1), function(err,result){
							done();
							if(err){				
								return console.error('error de conexion', err);
							}else{
								console.log("Inserta dato producto 1 para iniciar venta");
								console.log("# Producto "+recuperaProducto);
								procesaRec();
							}					
						});
					}
					if (total_vol_p1 == 0){
						console.log("No hay venta para recuperar p1");
					}
				}					
			});
			
			client.query(sprintf("SELECT MAX(CAST(tot2 AS INT)) FROM recuperacion where idpos = '%1$s';",String(cara)), function(err,result){
				done();
				if(err){				
					return console.error('error de conexion', err);
				}else{				
					total_vol_p2 = (parseFloat(producto2)/100 - parseFloat(result.rows[0].max)/100).toFixed(3); /*global producto1*/
					console.log(total_vol_p2);
					if (total_vol_p2 != 0){
					    recuperaProducto = 2;
						client.query(sprintf("UPDATE recuperacion SET tot2='%1$s' where idpos = '1';",producto2), function(err,result){
							done();
							if(err){				
								return console.error('error de conexion', err);
							}else{
								console.log("Inserta dato para iniciar venta producto 2");
								console.log("# Producto "+recuperaProducto);
								procesaRec();
							}					
						});
					}
					if (total_vol_p2 == 0){
						console.log("No hay venta para recuperar p2");
					}
				}					
			});
			
			client.query(sprintf("SELECT MAX(CAST(tot3 AS INT)) FROM recuperacion where idpos = '%1$s';",String(cara)), function(err,result){
				done();
				if(err){				
					return console.error('error de conexion', err);
				}else{				
					total_vol_p3 = (parseFloat(producto3)/100 - parseFloat(result.rows[0].max)/100).toFixed(3); /*global producto1*/
					console.log(total_vol_p3);
					if (total_vol_p3 != 0){
					    recuperaProducto = 3;
						client.query(sprintf("UPDATE recuperacion SET tot3='%1$s' where idpos = '1';",producto3), function(err,result){
							done();
							if(err){				
								return console.error('error de conexion', err);
							}else{
								console.log("Inserta dato producto 3 para iniciar venta");
								console.log("# Producto "+recuperaProducto);
								procesaRec();
							}					
						});
					}
					if (total_vol_p3 == 0){
						console.log("No hay venta para recuperar p3");
					}
				}					
			});			
			console.log("VentaPendiente: "+ventaPendiente);                                           
        }
	});
}

/*
*********************************************************************************************************
*                                function recuperacion()
*
* Description : Imprime corte pulsado desde pantalla
*               
*********************************************************************************************************
*/
function recuperacionSeg(){
	pg.connect(conString, function(err, client, done){
	    if(err){
            return console.error('error de conexion 1', err);
         }else{                                                           
			client.query(sprintf("SELECT MAX(CAST(tot1 AS INT)) FROM recuperacion where idpos = '%1$s';",String(cara)), function(err,result){
				done();
				if(err){				
					return console.error('error de conexion', err);
				}else{				
					total_vol_p1 = (parseFloat(producto1)/100 - parseFloat(result.rows[0].max)/100).toFixed(3); /*global producto1*/
					console.log(total_vol_p1);
					if (total_vol_p1 != 0){
					    recuperaProducto2 = 1;
						client.query(sprintf("UPDATE recuperacion SET tot1='%1$s' where idpos = '2';",producto1), function(err,result){
							done();
							if(err){				
								return console.error('error de conexion', err);
							}else{
								console.log("Inserta dato producto 1 lado2 para iniciar venta");
								console.log("# Producto "+recuperaProducto2);
								procesaRecSeg();
							}					
						});
					}
					if (total_vol_p1 == 0){
						console.log("No hay venta para recuperar p1");
					}
				}					
			});
			
			client.query(sprintf("SELECT MAX(CAST(tot2 AS INT)) FROM recuperacion where idpos = '%1$s';",String(cara)), function(err,result){
				done();
				if(err){				
					return console.error('error de conexion', err);
				}else{				
					total_vol_p2 = (parseFloat(producto2)/100 - parseFloat(result.rows[0].max)/100).toFixed(3); /*global producto1*/
					console.log(total_vol_p2);
					if (total_vol_p2 != 0){
					    recuperaProducto2 = 2;
						client.query(sprintf("UPDATE recuperacion SET tot2='%1$s' where idpos = '2';",producto2), function(err,result){
							done();
							if(err){				
								return console.error('error de conexion', err);
							}else{
								console.log("Inserta dato lado 2 para iniciar venta producto 2");
								console.log("# Producto "+recuperaProducto2);
								procesaRecSeg();
							}					
						});
					}
					if (total_vol_p2 == 0){
						console.log("No hay venta para recuperar p2");
					}
				}					
			});
			
			client.query(sprintf("SELECT MAX(CAST(tot3 AS INT)) FROM recuperacion where idpos = '%1$s';",String(cara)), function(err,result){
				done();
				if(err){				
					return console.error('error de conexion', err);
				}else{				
					total_vol_p3 = (parseFloat(producto3)/100 - parseFloat(result.rows[0].max)/100).toFixed(3); /*global producto1*/
					console.log(total_vol_p3);
					if (total_vol_p3 != 0){
					    recuperaProducto2 = 3;
						client.query(sprintf("UPDATE recuperacion SET tot3='%1$s' where idpos = '2';",producto3), function(err,result){
							done();
							if(err){				
								return console.error('error de conexion', err);
							}else{
								console.log("Inserta dato producto 3 lado 2 para iniciar venta");
								console.log("# Producto "+recuperaProducto2);
								procesaRecSeg();
							}					
						});
					}
					if (total_vol_p3 == 0){
						console.log("No hay venta para recuperar p3");
					}
				}					
			});			
			console.log("VentaPendiente2: "+ventaPendiente2);                                           
        }
	});
}




/*
*********************************************************************************************************
*                                function procesaRec()
*
* Description : Imprime corte pulsado desde pantalla
*               
*********************************************************************************************************
*/
function procesaRec(){
    pg.connect(conString, function(err, client, done){
        if(err){
            return console.error('error de conexion procesaRec', err);
        }else{
            if(ventaPendiente ==1){
                ventaPendiente = 0;
    	        client.query(sprintf("SELECT MAX(id) FROM venta where cara = '%1$s';",String(cara)), function(err,result){
                    done();
                    if(err){
                        return console.error('error seleccion MAX venta', err);
                    }else{
                        var last_id = result.rows[0].max;
                        idVentaRecuperada = last_id;
                        client.query(sprintf("SELECT id_venta from venta where id = (select max(id) from venta where enviada = true and id_venta !='NaN');"), function(err,result){
                            done();
                            if(err){
                                return console.error('error seleccion id_venta', err);
                            }else{
                                id_ventarec = '1'+String(result.rows[0].id_venta); 
                            }
                        });
                        
                       
                        client.query(sprintf("SELECT enviada, cara, producto,precio FROM venta WHERE id ='%1$s';",last_id), function(err,result){
                            done();
                            if(err){
                                return console.error('error seleccion de venta recuperada', err); 
                            }else{
                                //console.log("Enviada>>"+result.rows[0].enviada);
                                console.log("ID Venta recuperada: " +id_ventarec);
                                if(!result.rows[0].enviada){
                                    console.log(total_vol_p1);
                                    console.log(total_vol_p2);
                                    console.log(total_vol_p3);
                                    if (recuperaProducto == 1){
                                        vol_tabla = total_vol_p1;
                                    }
                                    if (recuperaProducto == 2){
                                        vol_tabla = total_vol_p2;
                                    }
                                    if (recuperaProducto == 3){
                                        vol_tabla = total_vol_p3;
                                    }
                                    if (recuperaProducto!=1 && recuperaProducto!=2 && recuperaProducto!=3){
                                        vol_tabla = 0;
                                    }
                                    console.log(vol_tabla);
                                    dineroRecuperado = parseFloat(result.rows[0].precio)*vol_tabla;
                                    console.log("Dinero recuperado: "+dineroRecuperado );
                                    dineroRecuperado = parseInt(dineroRecuperado, 10);
                                    console.log("Venta Recuperada: "+dineroRecuperado );
                                    console.log("Cara" + cara);
                                    client.query(sprintf("UPDATE venta SET (volumen,dinero,enviada) = (%1$s,%2$s,%3$s) WHERE id='%4$s'",vol_tabla,dineroRecuperado,true,last_id), function(err,result){
                                        done();
                                        if(err){
                                            return console.error('error actualizacion venta recuperada', err); 
                                        }else{
                                            console.log("ID recuperada: " +id_ventarec);
                                            rest_sale_rec();
                                        }
                                    });
                                    
                                }
                            }
                        });
                    }                 
                });
        	        
    	    }else{
                console.log ("Sin recuperada");
            }
        }
    });
}

/*
*********************************************************************************************************
*                                function procesaRec()
*
* Description : Imprime corte pulsado desde pantalla
*               
*********************************************************************************************************
*/
function procesaRecSeg(){
    pg.connect(conString, function(err, client, done){
        if(err){
            return console.error('error de conexion procesaRec', err);
        }else{
            if(ventaPendiente2 ==1){
                ventaPendiente2 = 0;
    	        client.query(sprintf("SELECT MAX(id) FROM venta where cara = '%1$s';",String(cara)), function(err,result){
                    done();
                    if(err){
                        return console.error('error seleccion MAX venta', err);
                    }else{
                        var last_id = result.rows[0].max;
                        idVentaRecuperada = last_id;
                        client.query(sprintf("SELECT id_venta from venta where id = (select max(id) from venta where enviada = true and id_venta !='NaN');"), function(err,result){
                            done();
                            if(err){
                                return console.error('error seleccion id_venta', err);
                            }else{
                                id_ventarec = '1'+String(result.rows[0].id_venta); 
                            }
                        });
                        
                       
                        client.query(sprintf("SELECT enviada, cara, producto,precio FROM venta WHERE id ='%1$s';",last_id), function(err,result){
                            done();
                            if(err){
                                return console.error('error seleccion de venta recuperada', err); 
                            }else{
                                //console.log("Enviada>>"+result.rows[0].enviada);
                                console.log("ID Venta recuperada: " +id_ventarec);
                                if(!result.rows[0].enviada){
                                    console.log(total_vol_p1);
                                    console.log(total_vol_p2);
                                    console.log(total_vol_p3);
                                    if (recuperaProducto2 == 1){
                                        vol_tabla = total_vol_p1;
                                    }
                                    if (recuperaProducto2 == 2){
                                        vol_tabla = total_vol_p2;
                                    }
                                    if (recuperaProducto2 == 3){
                                        vol_tabla = total_vol_p3;
                                    }
                                    if (recuperaProducto2!=1 && recuperaProducto2!=2 && recuperaProducto2!=3){
                                        vol_tabla = 0;
                                    }
                                    console.log(vol_tabla);
                                    dineroRecuperado = parseFloat(result.rows[0].precio)*vol_tabla;
                                    console.log("Dinero recuperado: "+dineroRecuperado );
                                    dineroRecuperado = parseInt(dineroRecuperado, 10);
                                    console.log("Venta Recuperada: "+dineroRecuperado );
                                    console.log("Cara" + cara);
                                    client.query(sprintf("UPDATE venta SET (volumen,dinero,enviada) = (%1$s,%2$s,%3$s) WHERE id='%4$s'",vol_tabla,dineroRecuperado,true,last_id), function(err,result){
                                        done();
                                        if(err){
                                            return console.error('error actualizacion venta recuperada', err); 
                                        }else{
                                            console.log("ID recuperada: " +id_ventarec);
                                            rest_sale_rec();
                                        }
                                    });
                                    
                                }
                            }
                        });
                    }                 
                });
        	        
    	    }else{
                console.log ("Sin recuperada");
            }
        }
    });
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
            return console.error('error de conexion 1', err);
        }else{
            console.log('Entro a corte');
            console.log('N producto '+ productos);
            client.query(sprintf("SELECT MAX(id) FROM cortem where idpos = '%1$s';",String(cara)), function(err,result){
                done();
                if(err){
                    return console.error('error inicio corte', err);
                }else{
                    var last_corte = result.rows[0].max;
                   
                    printport.write('  '+linea1 +'\n');
                    printport.write('   '+linea2 +'\n');
                    printport.write('      '+nit+'\n');
                    printport.write('      Tel: '+tel+'\n');
                    printport.write('  '+dir+ '\n\n');                      
                    printport.write('  Corte de venta \n\n');
                    printport.write('No de Corte: ' + String(last_corte+1) + '\n\n');
                    printport.write('Cara: ' + cara+ '\n');
                    var f = new Date();
					printport.write('Fecha:' + String(f.getDate() + "-" + (f.getMonth() + 1) + "-" + f.getFullYear() + ' ' + f.getHours() + ':' + f.getMinutes()) + '\n\n');                                                      
                        
                    }
                
                
            });
            client.query(sprintf("SELECT MAX(ultima_venta) FROM cortem where idpos = '%1$s';",String(cara)), function(err,result){
                done();
                if(err){
                    return console.error('error seleccion ultimo corte', err);
                }else{
                    var last_id = result.rows[0].max;
                    console.log('Resultado: '+result.rows[0].max);
                    // Lee el �ltimo volumen electr�nico del equipo en la DB y hace la resta con el valor enviado por el equipo
                    client.query(sprintf("SELECT MAX(CAST(u_vol AS INT)) FROM cortem where idpos = '%1$s';",String(cara)),function(err,result){
						        done();
						        if(err){
							        return console.error('error toma totales',err);
						        }else{
						            total_vol_p1 = parseFloat(producto1)/100 - parseFloat(result.rows[0].max)/100; /*global producto1*/
						            console.log(total_vol_p1);
						        }
						    });
			        client.query(sprintf("SELECT MAX(CAST(u_vol_2 AS INT)) FROM cortem where idpos = '%1$s';",String(cara)),function(err,result){
						        done();
						        if(err){
							        return console.error('error toma totales',err);
						        }else{
						            total_vol_p2 = parseFloat(producto2)/100 - parseFloat(result.rows[0].max)/100; /*global producto2*/
						            console.log(total_vol_p2);
						        }
						    });	
				    client.query(sprintf("SELECT MAX(CAST(u_vol_3 AS INT)) FROM cortem where idpos = '%1$s';",String(cara)),function(err,result){
				        done();
				        if(err){
					        return console.error('error toma totales',err);
				        }else{
				            total_vol_p3 = parseFloat(producto3)/100 - parseFloat(result.rows[0].max)/100; /*global producto3*/
				            console.log(total_vol_p3);
				        }
				    });
                    
                    
                    //<!--Sumatoria de dinero de las ventas realizadas por Beagle-->
                    
					if (cara == '1'){
						client.query(sprintf("SELECT SUM(CAST(dinero AS INT)),COUNT(dinero) FROM venta WHERE id>%1$s AND producto='%2$s' AND cara = '1'; ", last_id,idenproducto1), function(err,result){
							done();
							if(err){
								return console.error('error toma totales',err);
							}else{
								console.log("Primer producto");
								console.log('Cuenta'+result.rows[0].count);
								printport.write('Ventas ' +n_producto1+':' + String(result.rows[0].count) + '\n'); 
								if(result.rows[0].sum==null){
									result.rows[0].sum=0;}
								printport.write('Total '+n_producto1+' $ :' + String(result.rows[0].sum) + '\n');
								printport.write('Total '+n_producto1+' G :' +String(total_vol_p1.toFixed(3)) + '\n');
								printport.write(n_producto1+' Vol. Final: ' +parseFloat(producto1)/100 + '\n\n');							
							}
						});
					}
					if (cara == '2'){
						client.query(sprintf("SELECT SUM(CAST(dinero AS INT)),COUNT(dinero) FROM venta WHERE id>%1$s AND producto='%2$s' AND cara = '2'; ", last_id,idenproducto1b), function(err,result){
							done();
							if(err){
								return console.error('error toma totales',err);
							}else{
								console.log("Primer producto");
								console.log('Cuenta'+result.rows[0].count);
								printport.write('Ventas ' +n_producto1b+':' + String(result.rows[0].count) + '\n'); 
								if(result.rows[0].sum==null){
									result.rows[0].sum=0;}
								printport.write('Total '+n_producto1b+' $ :' + String(result.rows[0].sum) + '\n');
								printport.write('Total '+n_producto1b+' G :' +String(total_vol_p1.toFixed(3)) + '\n');
								printport.write(n_producto1b+' Vol. Final: ' +parseFloat(producto1)/100 + '\n\n');							
							}
						});
					}
                    
					if(productos > 2 || productosB > 2){
						if (cara == '1'){
							console.log("Segundo producto");
							client.query(sprintf("SELECT SUM(CAST(dinero AS INT)),COUNT(dinero) FROM venta WHERE id>%1$s AND producto='%2$s' AND cara ='1'; ", last_id,idenproducto2), function(err,result){
								done();
								if(err){
									return console.error('error toma totales', err);
								}else{
									console.log('Cuenta'+result.rows[0].count);
									printport.write('Ventas '+n_producto2+':' + String(result.rows[0].count) + '\n'); 
									if(result.rows[0].sum==null){
										result.rows[0].sum=0;}
									printport.write('Total '+n_producto2+' $: ' + String(result.rows[0].sum) + '\n');
									printport.write('Total '+n_producto2+' G:' +String(total_vol_p2.toFixed(3)) + '\n');
									printport.write(n_producto2+' Vol. Final: ' + parseFloat(producto2)/100 + '\n\n');
								}
							});
						}
						if (cara == '2'){
							console.log("Segundo producto");
							client.query(sprintf("SELECT SUM(CAST(dinero AS INT)),COUNT(dinero) FROM venta WHERE id>%1$s AND producto='%2$s' AND cara = '2'; ", last_id,idenproducto2b), function(err,result){
								done();
								if(err){
									return console.error('error toma totales', err);
								}else{
									console.log('Cuenta'+result.rows[0].count);
									printport.write('Ventas '+n_producto2b+':' + String(result.rows[0].count) + '\n'); 
									if(result.rows[0].sum==null){
										result.rows[0].sum=0;}
									printport.write('Total '+n_producto2b+' $: ' + String(result.rows[0].sum) + '\n');
									printport.write('Total '+n_producto2b+' G:' +String(total_vol_p2.toFixed(3)) + '\n');
									printport.write(n_producto2b+' Vol. Final: ' + parseFloat(producto2)/100 + '\n\n');
								}
							});
						}
					}
					
                    if (productos > 5 || productosB > 5){
						console.log("Tercer producto");
						if (cara == '1'){
							client.query(sprintf("SELECT SUM(CAST(dinero AS INT)),COUNT(dinero) FROM venta WHERE id>%1$s AND producto='%2$s' AND cara = '1'; ", last_id,idenproducto3), function(err,result){
								done();
								if(err){
									return console.error('error toma totales', err);
								}else{
									console.log('Cuenta'+result.rows[0].count);
									printport.write('Ventas '+n_producto3+':' + String(result.rows[0].count) + '\n'); 
									if(result.rows[0].sum==null){
									result.rows[0].sum=0;}
									printport.write('Total '+n_producto3+' $: ' + String(result.rows[0].sum) + '\n');
									printport.write('Total '+n_producto3+' G: ' +String(total_vol_p3.toFixed(3)) + '\n');
									printport.write(n_producto3+' Vol. Final: ' + parseFloat(producto3)/100 + '\n\n');
								} 
							});
						}
						if (cara == '2'){
							client.query(sprintf("SELECT SUM(CAST(dinero AS INT)),COUNT(dinero) FROM venta WHERE id>%1$s AND producto='%2$s' AND cara = '2'; ", last_id,idenproducto3b), function(err,result){
								done();
								if(err){
									return console.error('error toma totales', err);
								}else{
									console.log('Cuenta'+result.rows[0].count);
									printport.write('Ventas '+n_producto3b+':' + String(result.rows[0].count) + '\n'); 
									if(result.rows[0].sum==null){
									result.rows[0].sum=0;}
									printport.write('Total '+n_producto3b+' $: ' + String(result.rows[0].sum) + '\n');
									printport.write('Total '+n_producto3b+' G: ' +String(total_vol_p3.toFixed(3)) + '\n');
									printport.write(n_producto3b+' Vol. Final: ' + parseFloat(producto3)/100 + '\n\n');
								} 
							});
						}
					}
                    if(imprime_contadores == 1){       
                                printport.write('Visitas: ' + visitasDia + 'd  ' + visitasSema + 's  ' + visitasMes + 'm  ' + '\n\n\n');
                                printport.write('Volumen dia: G' + volDia +'\n\n');
                                printport.write('Volumen sem: G' + volSema +'\n\n');
                                printport.write('Volumen mes: G' + volMes +'\n\n\n');
                                printport.write('Dinero dia:  $' + dineroDia +'\n\n');
                                printport.write('Dinero sem:  $' + dineroSema +'\n\n');
                                printport.write('Dinero mes:  $' + dineroMes +'\n\n\n'); 
                    }
                    if (cara == '1'){
					       client.query("SELECT MAX(id) FROM venta where cara = '1';", function(err,result){
                                done();
                                if(err){
                                    return console.error('error de conexion', err);
                                }else{
                                    printport.write('\n\n\n\n\n\n');
                                    var last_id = result.rows[0].max;
                                    //<!--inserta identificador de corte y �ltimos totales>
                                    client.query(sprintf("INSERT INTO cortem (ultima_venta,u_vol,u_vol_2,u_vol_3,idpos) VALUES ('%1$s','%2$s','%3$s','%4$s','%5$s');",last_id,producto1,producto2,producto3,String(cara)), function(err,result){
                                        done();
                                        if(err){                                           
                                            return console.error('error de conexion', err); 
                                        }
                                    });
                                }                 
                            }); 
                    }
                    if (cara == '2'){   
                            client.query("SELECT MAX(id) FROM venta where cara = '2';", function(err,result){
                                done();
                                if(err){
                                    return console.error('error de conexion', err);
                                }else{
                                    printport.write('\n\n\n\n\n\n');
                                    var last_id = result.rows[0].max;
                                    //<!--inserta identificador de corte y �ltimos totales>
                                    client.query(sprintf("INSERT INTO cortem (ultima_venta,u_vol,u_vol_2,u_vol_3,idpos) VALUES ('%1$s','%2$s','%3$s','%4$s','%5$s');",last_id,producto1,producto2,producto3,String(cara)), function(err,result){
                                        done();
                                        if(err){                                            
                                            return console.error('error de conexion', err); 
                                        }
                                    });
                                }                 
                            });
                    }
                            
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
        caso    = data[3]; /*global caso*/
        caso2   = data[4]; /*global caso2*/
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
                if(permite == 0 || permite2 == 0){
                    muxport.write('BBB');           //En caso de venta incompleta
                    muxport.write('E');             // No permite autorizar
                    muxport.write(String(cara));
                    muxport.write('1');             //Limpia estado del mux e inicia pantalla
                    printport.write('\nCierre turno');
                    if(permite == 0){
                        printport.write('\nEn cara: A');    
                    }
                    if(permite2 == 0){
                        printport.write('\nEn cara: B');    
                    }
                    printport.write('\npara iniciar venta.\n\n\n\n\n\n\n\n\n\n\n');
                    muxport.write('*');
                }else{
                    var a = sprintf(url_auto+"/rest/Authorize/%1$s/%2$s/%3$s/%4$s/%5$s/%6$s/%7$s", serial, idproducto, idestacion, precio, tipopreset, preset, km);
                    console.log('>>'+a);
                    muxport.write('OK');
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
                var f = new Date();
                fecha = f.getDate() + "-" + (f.getMonth() +1) + "-" + f.getFullYear() + ' ' + f.getHours() + '_' + f.getMinutes();
                console.log('Fecha: '+fecha);
                muxport.write('OK');
                var n_id = idestacion + id_venta;
                if(serial =='0000000000000000'){
                    saveEfectivo = 1;
                    insertado = 0;
                    autorizaefec = '00000000-0000-0000-0000-000000000000';
                    var b = sprintf(url_save+"/rest/UploadSale/%1$s/%2$s/%3$s/%4$s/%5$s/%6$s/%7$s/%8$s/%9$s/%10$s/%11$s/%12$s", cara, idproducto, volumen, dinero, precio, idestacion, serial, autorizaefec, n_id, km, fecha, fecha);
                }else{
                    saveEfectivo = 0;
                    insertado = 1;
                    b = sprintf(url_save+"/rest/UploadSale/%1$s/%2$s/%3$s/%4$s/%5$s/%6$s/%7$s/%8$s/%9$s/%10$s/%11$s/%12$s", cara, idproducto, volumen, dinero, precio, idestacion, serial, autorizacion, n_id, km, fecha, fecha);
                }
                console.log('>>'+b);
                console.log(n_id);
                if (cara == '1'){
                    imp = 0;
                }else{
                    imp2 = 0;
                }
                rest_sale();    
            break;
            
            case '2':                                                           //Caso corte manual
                cara = data[75];
                console.log(cara);
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
                muxport.write('OK');
                console.log('OK'); 
            break;   
            
            case '3':
                printport.write('****** Copia ******\n'); /// impresi�n de copia de venta
                print_venta();
            break;
            
           case '4':
			id_p1 = 0;
			id_p2 = 0;
			id_p3 = 0;   //Opci�n de configuraci�n de productos
			id_p4 = 0;
			idenproducto1 = 0;
            idenproducto2 = 0;
            idenproducto3 = 0;
            id_p1b = 0;
			id_p2b = 0;
			id_p3b = 0;   //Opci�n de configuraci�n de productos
			id_p4b = 0;
			idenproducto1b = 0;
            idenproducto2b = 0;
            idenproducto3b = 0;
            if( data[7] =='1'){
                switch (caso2){         //Asignaci�n de nombres de productos y mangueras seg�n trama
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
								return console.error('error de conexion 1', err);                                
                         }else{
                            client.query(sprintf("UPDATE productos SET diesel='%1$s', corriente = '%2$s', extra = '%3$s', s_diesel ='%4$s' where id='%5$s' ",id_p1,id_p2,id_p3,id_p4,data[7]), function(err,result){
                            done();
                            if(err){                                
								return console.error('error update productos', err);                            
                            }else{                                
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
                             return console.error('error de conexion 1', err);
                         }else{
                            client.query(sprintf("UPDATE productos SET diesel='%1$s', corriente = '%2$s', extra = '%3$s', s_diesel ='%4$s' where id='%5$s' ",id_p1,id_p2,id_p3,id_p4,data[7]), function(err,result){
                            done();
                            if(err){                                
                                return console.error('error update productos', err);
                            }else{                                
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
                                return console.error('error de conexion 1', err);                                
                         }else{
                            client.query(sprintf("UPDATE productos SET diesel='%1$s', corriente = '%2$s', extra = '%3$s', s_diesel ='%4$s' where id='%5$s' ",id_p1,id_p2,id_p3,id_p4,data[7]), function(err,result){
                            done();
                            if(err){								
                                return console.error('error update productos', err);                                
                            }else{                                
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
                             return console.error('error de conexion 1', err);                                
                         }else{
                             //<!--Actualiza productos asignados en la DB>
                            client.query(sprintf("UPDATE productos SET diesel='%1$s', corriente = '%2$s', extra = '%3$s', s_diesel ='%4$s' where id='%5$s' ",id_p1,id_p2,id_p3,id_p4,data[7]), function(err,result){
                            done();
                            if(err){
								                             
								return console.error('error update productos', err);                                
                            }else{                                
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
                }    
            if (data[7] =='2'){
                switch (caso2){
                    case 'D':
                        n_producto1b = 'Diesel';
                        id_p1b = 1;
                        idenproducto1b = 1;
                        grado = data[5];
						switch (grado){             
							case '0':
							n_producto2b = 'No Presente';
							n_producto3b = 'No Presente';
							break;
							case 'C':
							id_p2b = 2;
							n_producto2b = 'Corriente';
							idenproducto2b = 2;
							break;
							case 'E':
							id_p3b = 2;
							n_producto2b = 'Extra';
							idenproducto2b = 3;
							break;
							case 'S':
							n_producto2b = 'S Diesel';
							idenproducto2b = 4;
							id_p4b = 2;
							break;
						}
						grado = data[6];
						switch (grado){
							case '0':
							n_producto3b = 'No Presente';
							break;
							case 'C':
							n_producto3b = 'Corriente';
							idenproducto3b = 2;
							id_p2b = 3;
							break;
							case 'E':
							n_producto3b = 'Extra';
							idenproducto3b = 3;
							id_p3b = 3;
							break;
							case 'S':
							n_producto3b = 'S Diesel';
							idenproducto3b = 4;
							id_p4b = 3;
							break;
						}
                        
                         pg.connect(conString, function(err, client, done){
                         if(err){
								return console.error('error de conexion 1', err);                                
                         }else{
                            client.query(sprintf("UPDATE productos SET diesel='%1$s', corriente = '%2$s', extra = '%3$s', s_diesel ='%4$s' where id='%5$s' ",id_p1b,id_p2b,id_p3b,id_p4b,data[7]), function(err,result){
                            done();
                            if(err){
								return console.error('error update productos', err);                            
                            }else{
                            } 
                                
                            });
                         }
                         });
                    break;
                    
                    case 'C':
                        n_producto1b = 'Corriente';
                        id_p2b =1;
                        idenproducto1b = 2;
						grado = data [5];
                        switch (grado){
							case '0':
							n_producto2b = 'No Presente';
							n_producto3b = 'No Presente';
							break;
							case 'D':
							id_p1b = 2;
							idenproducto2b = 1;
							n_producto2b = 'Diesel';
							break;
							case 'E':
							n_producto2b ='Extra';
							idenproducto2b = 3;
							id_p3b = 2;
							break;
							case 'S':
							n_producto2b = 'S Diesel';
							idenproducto2b = 4;
							id_p4b = 2;
							break;
						}
						grado = data[6];
						switch (grado){
							case '0':
							n_producto3b = 'No Presente';
							break;
							case 'D':
							id_p1b = 3;
							n_producto3b = 'Diesel';
							idenproducto3b = 1;
							break;
							case 'E':
							n_producto3b = 'Extra';
							idenproducto3b = 3;
							id_p3b = 3;
							break;
							case 'S':
							n_producto3b = 'S Diesel';
							idenproducto3b = 4;
							id_p4b = 3;
							break;
						}
                        
                         pg.connect(conString, function(err, client, done){
                         if(err){                             
                             return console.error('error de conexion 1', err);
                         }else{
                            client.query(sprintf("UPDATE productos SET diesel='%1$s', corriente = '%2$s', extra = '%3$s', s_diesel ='%4$s' where id='%5$s' ",id_p1b,id_p2b,id_p3b,id_p4b,data[7]), function(err,result){
                            done();
                            if(err){
                                return console.error('error update productos', err);
                            }else{                                
                            } 
                            });
                         }
                         });
                       
                        
                    break;
                    
                    case 'E':
                        n_producto1b = 'Extra';
                        id_p3b = 1;
                        idenproducto1b = 3;
						grado = data [5];
                        switch (grado){
							case '0':
							n_producto2b = 'No Presente';
							n_producto3b = 'No Presente';
							break;
							case 'C':
							id_p2b = 2;
							n_producto2b = 'Corriente';
							idenproducto2b = 2;
							break;
							case 'D':
							id_p1b = 2;
							n_producto2b = 'Diesel';
							idenproducto2b = 1;
							break;
							case 'S':
							n_producto2b = 'S Diesel';
							idenproducto2b = 4;
							id_p4b = 2;
							break;
						}
						grado = data[6];
						switch (grado){
							case '0':
							n_producto3b = 'No Presente';
							break;
							case 'C':
							n_producto3b = 'Corriente';
							idenproducto3b= 2;
							id_p2b = 3;
							break;
							case 'D':
							n_producto3b = 'Diesel';
							idenproducto3b = 1;
							id_p1b = 3;
							break;
							case 'S':
							n_producto3b = 'S Diesel';
							idenproducto3b = 4;
							id_p4b = 3;
							break;
						}
                        
                         pg.connect(conString, function(err, client, done){
                         if(err){							    
                                return console.error('error de conexion 1', err);                                
                         }else{
                            client.query(sprintf("UPDATE productos SET diesel='%1$s', corriente = '%2$s', extra = '%3$s', s_diesel ='%4$s' where id='%5$s' ",id_p1b,id_p2b,id_p3b,id_p4b,data[7]), function(err,result){
                            done();
                            if(err){								
                                return console.error('error update productos', err);                                
                            }else{                                
                            } 
                            });
                         }
                         });
                    break;
                    
                    case 'S':
                        n_producto1b = 'S Diesel';
                        id_p4b = 1;
                        idenproducto1b = 4;
                        grado = data [5];
                        switch (grado){
							case '0':
							n_producto2b = 'No Presente';
							n_producto3b = 'No Presente';
							break;
							case 'C':
							id_p2b = 2;
							n_producto2b = 'Corriente';
							idenproducto2b = 2;
							break;
							case 'D':
							id_p1b = 2;
							n_producto2b = 'Diesel';
							idenproducto2b = 1;
							break;
							case 'E':
							n_producto2b = 'Extra';
							idenproducto2b = 3;
							id_p3b = 2;
							break;
						}
						grado = data[6];
						switch (grado){
							case '0':
							n_producto3b = 'No Presente';
							break;
							case 'C':
							n_producto3b = 'Corriente';
							idenproducto3b = 2;
							id_p2b = 3;
							break;
							case 'D':
							n_producto3b = 'Diesel';
							idenproducto3b = 1;
							id_p1b = 3;
							break;
							case 'S':
							n_producto3b = 'Extra';
							idenproducto3b = 3;
							id_p3b = 3;
							break;
						}
                        
                         pg.connect(conString, function(err, client, done){
                         if(err){														 
                             return console.error('error de conexion 1', err);                                
                         }else{
                             //<!--Actualiza productos asignados en la DB>
                            client.query(sprintf("UPDATE productos SET diesel='%1$s', corriente = '%2$s', extra = '%3$s', s_diesel ='%4$s' where id='%5$s' ",id_p1b,id_p2b,id_p3b,id_p4b,data[7]), function(err,result){
                            done();
                            if(err){								                               
								return console.error('error update productos', err);                                
                            }else{                                
                                productosB = id_p1b + id_p2b + id_p3b + id_p4b; //Cantidad de mangueras presentes
                                console.log(productosB); 
                                console.log(n_producto1b);
                                console.log(n_producto2b);
                                console.log(n_producto3b);
                            } 
                            });
                         }
                         });
                    break;
                }
            }
            break;
            
            case 'E':
                if(data[4] == '0'){
                    muxport.write('BBB');
                    muxport.write('1');
                    muxport.write(cara);
                    if(data[5] == '1'){
                        console.log('\n\nEl Equipo no recibio la programaci�n.\nerror: 1.\n');            //No cambio el precio
                    }else if(data[5] == '2'){
                        console.log('\n\nEl Equipo no recibio la programaci�n.\nerror: 2.\n');           //No recibio el preset
                    }
                    muxport.write('*'); 
                }
            break; 
            
            case '5':                                                           //Caso corte manual
                cara = data[75];
                console.log(cara);
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
                if(cara == '1'){
                    recuperacion();    
                }
                if(cara == '2'){
                    recuperacionSeg();    
                }
                console.log('OK'); 
            break; 
        }
    }
    
}
/*
*********************************************************************************************************
*                                function actualAuto()
*
* Description : Guarda la venta en la base de datos
*               
*********************************************************************************************************
*/
function actualDato(){
    pg.connect(conString, function(err, client, done){
            if(err){
                return console.error('error de conexion 1', err);
            }else{
                client.query(sprintf("SELECT autorizacion FROM venta WHERE id=(SELECT MAX(id) FROM venta) AND cara = '%1$s';",String(cara)), function(err,result){
                    done();
                    if(err){
                        return console.error('error tomar autorizacion', err);
                    }else{
                        autorizacion = result.rows[0].autorizacion;
                        console.log(autorizacion);
                    }                 
                });   
            }
    });
 
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
        
            var result = JSON.parse(jsonString);            //Respuesta autogas en autorizaci�n
        
            cantidadAutorizada  =  String(result.aT0001responseREST.cantidadAutorizada.value);
            codigoRetorno       =  result.aT0001responseREST.codigoRetorno.value;
            direccion           =  result.aT0001responseREST.direccion.value;
            telefono            =  result.aT0001responseREST.telefono.value;
            idproducto          =  result.aT0001responseREST.idproducto.value;
            numeroAutorizacion  =  result.aT0001responseREST.numeroAutorizacion.value;
            nombreCuenta        =  result.aT0001responseREST.nombreCuenta.value;
            placa               =  result.aT0001responseREST.placa.value;  
            retorno             =  result.aT0001responseREST.retorno.value;
            tipoConvenio        =  result.aT0001responseREST.tipoConvenio.value;
            tipoRetorno         =  result.aT0001responseREST.tipoRetorno.value;
            trama               =  result.aT0001responseREST.trama.value;
            valorConvenio       =  String(result.aT0001responseREST.valorConvenio.value);
            if(serial !='0000000000000000'){
                autorizacion =  String(numeroAutorizacion);
            }else{
                autorizacion = '00000000-0000-0000-0000-000000000000';
            }
            autorizaMux();
            console.log(direccion);
            console.log(placa);
            console.log("Termina post");
        });
    }, function(err) {                              //error en el envio de datos
        console.log(err.stack);
        console.log("Termina post con error");
        muxport.write('BBB');
        muxport.write('E');
        muxport.write(String(cara));
        muxport.write('1');                         //Limpia estado del mux e inicia pantalla
        muxport.write('*');
        printport.write('\n\nLos datos no se lograron\nenviar al servidor.\n\n\n\n\n\n\n');
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
                return console.error('error de conexion 1', err);
            }else{
                var f = new Date();
                fecha = f.getDate() + "-" + (f.getMonth() +1) + "-" + f.getFullYear() + ' ' + f.getHours() + '_' + f.getMinutes();
                client.query(sprintf("INSERT INTO venta (autorizacion, precio, placa, direccion, cara, producto, idestacion,serial,fecha,km,nombrecuenta,telefono) VALUES ('%1$s','%2$s','%3$s','%4$s','%5$s','%6$s','%7$s','%8$s','%9$s','%10$s','%11$s','%12$s');",autorizacion, precio, placa, direccion,cara , idproducto, idestacion,serial,fecha,km,nombreCuenta,telefono), function(err,result){
                    done();
                    if(err){                        
                        return console.error('error insertar venta', err);
                    }else{                        
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
    muxport.write('BBB');                                       //Encabezado
    console.log("BBB");
    muxport.write('0');                                         
    console.log('0');
    console.log("Envia datos de autorizacion");
    muxport.write(String(cara));                                //Cara
    console.log("Cara: "+cara);
    if(codigoRetorno==0){                                       //Si no hay error
        muxport.write(String(idproducto));                      //Id Producto
        console.log("Id Producto: "+idproducto);                                        
        console.log("Precio: ");                                //Precio
        if(tipoConvenio == 1){                                  //Convenio: el mismo precio de estacion
            for(var i=1; i<=4; i++){
                muxport.write('0');
                console.log('0');
            }
            muxport.write('F'); 
            console.log('F');
        }
        if(tipoConvenio == 2){                                  //Convenio: Descuento en pesos
            valorConvenio = String(parseInt(precio,10) - parseInt(valorConvenio,10));
            for(i=valorConvenio.length; i<=4; i++){
                muxport.write('0');
                console.log('0');
            }
            muxport.write(valorConvenio); 
            console.log(valorConvenio); 
            precio = valorConvenio;
        }
        if(tipoConvenio == 3){                                  //Convenio: Descuento en %
            valorConvenio = String(Math.round((parseInt(precio,10) * parseInt(valorConvenio,10)) / 100));
            for(i=valorConvenio.length; i<=4; i++){
                muxport.write('0');
                console.log('0');
            }
            muxport.write(valorConvenio); 
            console.log(valorConvenio);   
            precio = valorConvenio;
        }        
        if(tipoConvenio == 4){                                  //Convenio: Enviaron Precio
            for(i=valorConvenio.length; i<=4; i++){
                muxport.write('0');
                console.log('0');
            }
            muxport.write(valorConvenio); 
            console.log(valorConvenio); 
            precio = valorConvenio;
        }
        if(tipoRetorno==1){//si es dinero cambia el tipo de valor float a int///////////////////////////////////////////////////////////
            cantidadAutorizada = parseInt(cantidadAutorizada,10);
        }
        cantidadAutorizada = String(cantidadAutorizada); //envia datos en string a la web
        for(i=cantidadAutorizada.length; i<=6; i++){
            muxport.write('0');
            console.log('0');
        } 
        muxport.write(cantidadAutorizada);
        console.log('Cantidad Autorizada: '+cantidadAutorizada);
        muxport.write(String(tipoRetorno));
        console.log('Tipo de Preset: '+tipoRetorno);       
    }
    else{
        muxport.write('N');

        printport.write('\n\nERROR:\n ');//mod ayer
        switch(codigoRetorno){
            case 0:                                     //C�digos de error de autogas para negar despacho
               printport.write('\n�XITO\n'); 
            break; 
            case 100:
               printport.write('\nEL SERIAL DEL VEHICULO  NO EXISTE\n'); 
            break; 
            case 200:
               printport.write('\nPARAMETROS DE ENTRADA\n'); 
               printport.write('\nINCORRECTOS\n');                
            break; 
            case 300:
               printport.write('\nERROR DESCONOCIDO\n'); 
            break; 
            case 350:
                   printport.write('\nVEHICULO CONSUMIENDO\n'); 
            break;
            case 400:
               printport.write('\nCUENTA SIN CUPO\n'); 
            break; 
            case 501:
               printport.write('\nVEHICULO NO TIENE VOLUMEN AL DIA\n'); 
            break; 
            case 502:
               printport.write('\nVEHICULO NO TIENE VOLUMEN A LA\n'); 
               printport.write('\nSEMANA\n');               
            break; 
            case 503:
               printport.write('\nVEHICULO NO TIENE VOLUMEN AL\n'); 
               printport.write('\nMES\n');                
            break; 
            case 601:
               printport.write('\nVEHICULO NO TIENE VISITAS AL DIA\n'); 
            break; 
            case 602:
               printport.write('\nVEHICULO NO TIENE VISITAS A LA\n'); 
               printport.write('\nSEMANA\n');               
            break; 
            case 603:
               printport.write('\nVEHICULO NO TIENE VISITAS AL MES\n'); 
            break; 
            case 701:
               printport.write('\nVEHICULO NO TIENE DINERO AL DIA\n'); 
            break; 
            case 702:
               printport.write('\nVEHICULO NO TIENE DINERO A LA\n'); 
               printport.write('\nSEMANA\n');                
            break; 
            case 703:
               printport.write('\nVEHICULO NO TIENE DINERO AL MES\n'); 
            break; 
            case 801:
               printport.write('\nVEHICULO NO PUEDE TANQUEAR EN\n'); 
               printport.write('\nESTA HORA\n'); 
            break; 
            case 901:
               printport.write('\nVEHICULO NO PUEDE TANQUEAR EN \n');
               printport.write('\nESTA EDS\n'); 
            break; 
            case 1001:
               printport.write('\nVEHICULO NO PUEDE TANQUEAR EL\n'); 
               printport.write('\nPRODUCTO SELECCIONADO\n');                
            break; 
            case 1101:
               printport.write('\nLA CUENTA SE ENCUENTRA EN\n'); 
               printport.write('\nESTADO BLOQUEADO\n');                
            break; 
            case 1102:
               printport.write('\nLA CUENTA  SE ENCUENTRA  EN UNA\n'); 
               printport.write('\nFECHA VENCIDA\n');                
            break; 
            case 1201:
               printport.write('\nEL VEHICULO SE ENCUENTRA EN\n'); 
               printport.write('\nESTADO BLOQUEADO\n'); 
            break; 
            case 1302:
               printport.write('\nLA EDS NO ES VALIDA\n'); 
            break; 
            case 1401:
               printport.write('\nEL KILOMETRAJE INGRESADO ES\n'); 
               printport.write('\nINFERIOR AL ULTIMO INGRESADO\n');                
            break; 
            case 1501:
               printport.write('\nEL VOLUMEN SUPERA LA CAPACIDAD\n'); 
               printport.write('\nDEL TANQUE DEL VEHICULO\n'); 
            break;             
        }
        printport.write('\nCODIGO DE ERROR: ');
        printport.write(String(codigoRetorno)); 
        printport.write('\n\n');
        //mod ayer
    }
    muxport.write('*');
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
            return console.error('error conexion save_sale', err);
        }else{
            volumen[3]=46;
            vol_tabla = parseFloat(volumen);
            client.query("SELECT MAX(id) FROM venta;", function(err,result){        //consulto maximo id de venta
                done();
                if(err){                    
                    return console.error('error toma MAX save_sale', err);
                }else{
                    console.log(result.rows[0].max);
                    var last_id = result.rows[0].max;           //Cargo el maximo id de venta
                    if(codigoError == '0' && error_local=='0'|| codigoError == '2002' || codigoError =='2001'){ //Cargar dato de si fue enviada o no la venta
                        b_enviada = 'TRUE';
                    }else{
                       b_enviada = 'FALSE';
                    }
                    console.log("Save sale>>"+id_venta);
                    client.query(sprintf("UPDATE venta SET (id_venta, id_estacion, serial,  cara, producto, precio, dinero, volumen, fecha, enviada) = ('%1$s','%2$s', '%3$s', '%4$s', '%5$s', '%6$s', '%7$s', '%8$s', '%9$s','%10$s') WHERE id= (SELECT MAX(id) FROM venta WHERE cara = '%4$s');",id_venta, idestacion, serial, cara, idproducto, precio, dinero, vol_tabla, fecha, b_enviada,last_id), function(err,result){
                        done();
                        if(err){                            
                            printrec = 0;
                            if(cara == '1'){
                                imp = 0;
                                if(printInt ==1){
                                    print_ventaInt(); //Imprime venta sin insertar en la DB    
                                }else{
                                    print_venta(); //Imprime venta sin insertar en la DB
                                }
                            }
                            if(cara == '2'){
                                imp2 = 0;
                                if(printInt2 ==1){
                                    print_ventaIntSeg(); //Imprime venta sin insertar en la DB    
                                }else{
                                    print_ventaSeg(); //Imprime venta sin insertar en la DB
                                }
                                
                            }
                            return console.error('error actualizacion save_sale', err); 
                        }else{
                            printrec = 0;                            
                            if(cara == '1'){
                                imp = 0;
                                if(printInt ==1){
                                    print_ventaInt(); //Imprime venta sin insertar en la DB    
                                }else{
                                    print_venta(); //Imprime venta sin insertar en la DB
                                }
                            }
                            if(cara == '2'){
                                imp2 = 0;
                                if(printInt2 ==1){
                                    print_ventaIntSeg(); //Imprime venta sin insertar en la DB    
                                }else{
                                    print_ventaSeg(); //Imprime venta sin insertar en la DB
                                }
                            }
                        }
                    });
                }                 
            });  
        }
    }); 
}


/*
*********************************************************************************************************
*                                function save_sale()
*
* Description : Guarda la venta en la base de datos
*               
*********************************************************************************************************
*/
function save_sale_ef(){
    pg.connect(conString, function(err, client, done){                  //conectar a la base de datos
        if(err){
            return console.error('error conexion save_sale', err);
        }else{
            volumen[3]=46;
            vol_tabla = parseFloat(volumen);
            console.log("Insertado: "+ insertado);
            client.query(sprintf("INSERT INTO venta  (id_venta, idestacion, serial,  cara, producto, precio, dinero, volumen, fecha, enviada,autorizacion,km) VALUES ('%1$s','%2$s', '%3$s', '%4$s', '%5$s', '%6$s', '%7$s', '%8$s', '%9$s','%10$s','%11$s','%12$s')", id_venta, idestacion, serial, cara, idproducto, precio, dinero, vol_tabla, fecha,b_enviada,'00000000-0000-0000-0000-000000000000',0), function(err,result){
                done();
                if(err){                    
                    printrec = 0;
                    if(cara == '1'){
                        imp = 0;
                        print_venta(); //Imprime venta sin insertar en la DB
                    }
                    if(cara == '2'){
                        imp2 = 0;
                        print_ventaSeg(); //Imprime venta sin insertar en la DB
                    }
                    return console.error('error actualizacion save_sale', err); 
                }else{
                    console.log("Save sale efectivo>>"+id_venta);
                    printrec = 0;
                    if(cara == '1'){
                        imp = 0;
                        print_venta(); //Imprime venta sin insertar en la DB
                    }
                    if(cara == '2'){
                        imp = 0;
                        print_ventaSeg(); //Imprime venta sin insertar en la DB
                    }                    
                }
            });
        }
    }); 
}


/*
*********************************************************************************************************
*                                function save_sale_rec()
*
* Description : Guarda la venta en la base de datos
*               
*********************************************************************************************************
*/
function save_sale_rec(){
    pg.connect(conString, function(err, client, done){                  //conectar a la base de datos
        if(err){
            return console.error('error conexion save_sale', err);
        }else{
            vol_tabla = volumenrec;
            client.query("SELECT MAX(id) FROM venta;", function(err,result){        //consulto maximo id de venta
                done();
                if(err){                    
                    return console.error('error toma MAX save_sale', err);
                }else{
                    console.log(result.rows[0].max);
                    var last_id = result.rows[0].max;           //Cargo el maximo id de venta
                    if(codigoError == '0' && error_local=='0'|| codigoError == '2002' || codigoError =='2001'){ //Cargar dato de si fue enviada o no la venta
                        b_enviada = 'TRUE';
                        imp='0';
                    }else{
                       b_enviada = 'FALSE';
                       imp ='1';
                    }
                    if(autorizacion == null){
                        b_enviada = 'TRUE';
                    }
                    console.log("Save sale>>"+id_ventarec);
                    client.query(sprintf("UPDATE venta SET (id_venta, id_estacion, serial,  cara, producto, precio, dinero, volumen, fecha, enviada) = ('%1$s','%2$s', '%3$s', '%4$s', '%5$s', '%6$s', '%7$s', '%8$s', '%9$s','%10$s') WHERE id='%11$s'", id_ventarec, idestacion, serialrec, cara, idproducto, preciorec, dinerorec, vol_tabla, fecha, b_enviada,last_id), function(err,result){
                    
                        done();
                        if(err){                            
                            printrec  = 1;
                            if(cara == '1'){
                                imp = 0;
                                print_venta(); //Imprime venta sin insertar en la DB
                            }
                            if(cara == '2'){
                                imp2 = 0;
                                print_ventaSeg(); //Imprime venta sin insertar en la DB
                            }
                            return console.error('error actualizacion save_sale', err); 
                        }else{
                            printrec = 1;
                            if(cara == '1'){
                                imp = 0;
                                print_venta(); //Imprime venta sin insertar en la DB
                            }
                            if(cara == '2'){
                                imp2 = 0;
                                print_ventaSeg(); //Imprime venta sin insertar en la DB
                            }                            
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
function rest_sale_internet(){
    var n_id = idestacionint + id_ventaint;
    printInt = 1;
    trycatch(function() {
        var opt_rest_venta = {
                url: sprintf(url_save+"/rest/UploadSale/%1$s/%2$s/%3$s/%4$s/%5$s/%6$s/%7$s/%8$s/%9$s/%10$s/%11$s/%12$s", caraint, idproductoint, volumenint, dineroint, precioint, idestacionint, serialint, autorizacionint, n_id, kmint, fechaint, fechaint), /*global autorizacion*//*global idestacion*/
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
            //nombreCuenta       =  result2.cV0001responseREST.nombreCuenta.value;
            placa              =  result2.cV0001responseREST.placa.value;
            retorno            =  result2.cV0001responseREST.retorno.value;
            saldo              =  String(result2.cV0001responseREST.saldo.value);
            visitasDia         =  String(result2.cV0001responseREST.visitasDia.value);
            visitasMes         =  String(result2.cV0001responseREST.visitasMes.value);
            visitasSema        =  String(result2.cV0001responseREST.visitasSema.value);
            volDia             =  String(result2.cV0001responseREST.volDia.value);
            volMes             =  String(result2.cV0001responseREST.volMes.value);
            volSema            =  String(result2.cV0001responseREST.volSema.value);
            if(caraint =='1'){
                imp =0;
            }
            if(caraint =='2'){
                imp2 =0;
            }
            console.log("Termina post");
            b_enviada = 'TRUE';
            error_local = '0';
            if(serialint =='0000000000000000'){
                save_sale_ef();    
            }
            if(serialint != '0000000000000000'){
                save_sale();
            }
        });
    }, function(err) {
        console.log(err.stack);
        console.log("Termina post con error");
        error_local = '1';
        b_enviada = 'FALSE'; 
        if(caraint =='1'){
            imp = 1;
        }
        if(caraint =='2'){
            imp2 = 1;
        }
        if(serialint =='0000000000000000'){
            save_sale_ef();    
        }
        if(serialint != '0000000000000000'){
            save_sale();
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
function rest_sale_internetSeg(){
    var n_id = idestacionint + id_ventaint;
    printInt2 =1;
    trycatch(function() {
        var opt_rest_venta = {
                url: sprintf(url_save+"/rest/UploadSale/%1$s/%2$s/%3$s/%4$s/%5$s/%6$s/%7$s/%8$s/%9$s/%10$s/%11$s/%12$s", caraint, idproductoint, volumenint, dineroint, precioint, idestacionint, serialint, autorizacionint, n_id, kmint, fechaint, fechaint), /*global autorizacion*//*global idestacion*/
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
            //nombreCuenta       =  result2.cV0001responseREST.nombreCuenta.value;
            placa              =  result2.cV0001responseREST.placa.value;
            retorno            =  result2.cV0001responseREST.retorno.value;
            saldo              =  String(result2.cV0001responseREST.saldo.value);
            visitasDia         =  String(result2.cV0001responseREST.visitasDia.value);
            visitasMes         =  String(result2.cV0001responseREST.visitasMes.value);
            visitasSema        =  String(result2.cV0001responseREST.visitasSema.value);
            volDia             =  String(result2.cV0001responseREST.volDia.value);
            volMes             =  String(result2.cV0001responseREST.volMes.value);
            volSema            =  String(result2.cV0001responseREST.volSema.value);
            if(caraint =='1'){
                imp =0;
            }
            if(caraint =='2'){
                imp2 =0;
            }
            console.log("Termina post");
            b_enviada = 'TRUE';
            error_local = '0';
            if(serialint =='0000000000000000'){
                save_sale_ef();    
            }
            if(serialint != '0000000000000000'){
                save_sale();
            }
        });
    }, function(err) {
        console.log(err.stack);
        console.log("Termina post con error");
        error_local = '1';
        b_enviada = 'FALSE'; 
        if(caraint =='1'){
            imp = 1;
        }
        if(caraint =='2'){
            imp2 = 1;
        }
        if(serialint =='0000000000000000'){
            save_sale_ef();    
        }
        if(serialint != '0000000000000000'){
            save_sale();
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
    if(cara =='1'){
        printInt = 0;
    }else{
        printInt2 = 0;
    }
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
            //nombreCuenta       =  result2.cV0001responseREST.nombreCuenta.value;
            placa              =  result2.cV0001responseREST.placa.value;
            retorno            =  result2.cV0001responseREST.retorno.value;
            saldo              =  String(result2.cV0001responseREST.saldo.value);
            visitasDia         =  String(result2.cV0001responseREST.visitasDia.value);
            visitasMes         =  String(result2.cV0001responseREST.visitasMes.value);
            visitasSema        =  String(result2.cV0001responseREST.visitasSema.value);
            volDia             =  String(result2.cV0001responseREST.volDia.value);
            volMes             =  String(result2.cV0001responseREST.volMes.value);
            volSema            =  String(result2.cV0001responseREST.volSema.value);
            if(cara =='1'){
                imp =0;
            }
            if(cara =='2'){
                imp2 =0;
            }
            console.log("Termina post");
            b_enviada = 'TRUE';
            error_local = '0';
            if(serial =='0000000000000000'){
                save_sale_ef();    
            }
            if(serial != '0000000000000000' ){
                save_sale();
            }
        });
    }, function(err) {
        console.log(err.stack);
        console.log("Termina post con error");
        error_local = '1';
        b_enviada = 'FALSE'; 
        if(cara =='1' && imp ==0){
            printport.write('No se logro enviar al servidor\n\n'); //Informa que no se pudo subir venta a remoto
            printport.write('*****VENTA ALMACENADA LOCAL*****\n');
            printport.write('****SIN CONEXION A INTERNET*****\n');
        }
        if(cara =='2' && imp2 ==0){
            printport.write('No se logro enviar al servidor\n\n'); //Informa que no se pudo subir venta a remoto
            printport.write('*****VENTA ALMACENADA LOCAL*****\n');
            printport.write('****SIN CONEXION A INTERNET*****\n');
        }
        if(serial =='0000000000000000'){
            save_sale_ef();    
        }
        if(serial != '0000000000000000'){
            save_sale();
        }
    });
}

/*
*********************************************************************************************************
*                                function rest_sale_rec()
*
* Description : LLama el servicio Web para guardar una venta recuperada
*               
*********************************************************************************************************
*/

function rest_sale_rec(){
	pg.connect(conString, function(err, client, done){                  //conectar a la base de datos
        if(err){
            return console.error('error de conexion', err);
        }else{
            console.log(enviaRecuperada);
			
			    client.query(sprintf("SELECT cara, producto, volumen, dinero, precio, idestacion, serial,km, autorizacion, id_venta,fecha,nombrecuenta,direccion,telefono FROM venta  WHERE id='%1$s'", idVentaRecuperada), function(err,result){
				done();
				if(err){
					return console.error('error de envio recuperada', err); 
				}else{
					cara         = result.rows[0].cara;
					idproducto   = result.rows[0].producto;
					volumenrec   = result.rows[0].volumen;
					volumenrec   = volumenrec.replace('.', ',');
					dinerorec    = result.rows[0].dinero;
					preciorec    = result.rows[0].precio;
					idestacion   = result.rows[0].idestacion;
					serialrec    = result.rows[0].serial;
					km           = result.rows[0].km;
					autorizacion = result.rows[0].autorizacion;	
					fecha        = result.rows[0].fecha;
					nombreCuenta = result.rows[0].nombrecuenta;
					direccion    = result.rows[0].direccion;
					telefono     = result.rows[0].telefono;

					console.log("Venta recuperada: ");
					console.log("Cara>> "+ cara);
					console.log("Producto>> "+ idproducto);
					console.log("Volumen>> "+ volumenrec);
					console.log("Dinero>> "+ dinerorec);
					console.log("Precio>> "+ preciorec);
					console.log("ID Estacion>> "+ idestacion);
					console.log("Serial>> "+ serialrec);
					console.log("Autorizacion>> "+ autorizacion);
					console.log("ID Venta>> "+ id_ventarec);
					console.log("Fecha>> "+ fecha);
					console.log("Cuenta>> "+ nombreCuenta);
					console.log("Direccion>> "+ direccion);
					console.log("Telefono>> "+ telefono);
					if(cara =='1'){
                        printInt = 0;
                    }else{
                        printInt2 = 0;
                    }
					trycatch(function() {
						var opt_rest_venta = {				
						url: sprintf(url_save+"/rest/UploadSale/%1$s/%2$s/%3$s/%4$s/%5$s/%6$s/%7$s/%8$s/%9$s/%10$s/%11$s/%12$s", cara, idproducto, volumenrec, dinerorec, preciorec, idestacion, serialrec, autorizacion, id_ventarec, km, fecha, fecha), /*global autorizacion*//*global idestacion*/
						method: "POST",
						    
						};   
						rest_venta(opt_rest_venta, 
						function(error, response, body) {			  		 
							var elements2 = ds.deserialize(body);
							var jsonString2 = ds.getJson(elements2);
						    console.log(opt_rest_venta);
							console.log(jsonString2);
						
							var result2 = JSON.parse(jsonString2);
						
							codigoError        =  result2.cV0001responseREST.codError.value;
							dineroDia          =  result2.cV0001responseREST.dineroDia.value;           //Resultados enviados por Autogas
							dineroMes          =  result2.cV0001responseREST.dineroMes.value;
							dineroSema         =  result2.cV0001responseREST.dineroSema.value;
							imprime_contadores =  String(result2.cV0001responseREST.imprimeContador.value);              
							imprime_saldo      =  String(result2.cV0001responseREST.imprimeSaldo.value);
							//nombreCuenta       =  result2.cV0001responseREST.nombreCuenta.value;
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
							save_sale_rec();
						});
					}, function(err) {
						console.log(err.stack);
						console.log("Termina post con error");
						error_local = '1';
						b_enviada = 'FALSE'; 
						if(imp =='0'){
							printport.write('No se logr� enviar al servidor\n\n'); //Informa que no se pudo subir venta a remoto
							printport.write('*****VENTA ALMACENADA LOCAL*****\n\n');
							save_sale_rec();    /// Guarda venta cuando no hay conexi�n a servidor
						}
					});
				}
			});
            
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
    console.log(codigoError);
    if(imp == 0){
                
        if(codigoError == '0'){
            muxport.write('BBB');
            muxport.write('E');
            muxport.write(String(cara));
            muxport.write('2');                         //Gracias por su compra
            muxport.write('*');        
            console.log("RECIBO");
            console.log('\n\n');
            printport.write('  '+linea1 +'\n');
            printport.write('   '+linea2 +'\n');
            printport.write('      '+nit+'\n');
            printport.write('      Tel: '+tel+'\n');
            printport.write('  '+dir+ '\n\n');
            if(printrec == 0){
                printport.write('Numero: ' +parseInt(idestacion+id_venta,10)+ '\n\n');
            }
            if(printrec == 1){
                printport.write('Numero: ' +id_ventarec+ '\n\n');
            }
            if(printrec == 2){
                printport.write('Numero: ' +id_venta+ '\n\n');
            }
            var f = new Date();
            printport.write('Fecha:' + String(f.getDate() + "-" + (f.getMonth() + 1) + "-" + f.getFullYear() + ' ' + f.getHours() + ':' + f.getMinutes()) + '\n\n');                                                      
            if(imprime_contadores == 1){         
                printport.write('Visitas: ' + visitasDia + 'd  ' + visitasSema + 's  ' + visitasMes + 'm  ' + '\n\n\n');
                printport.write('Volumen dia: G' + volDia +'\n');
                printport.write('Volumen sem: G' + volSema +'\n');
                printport.write('Volumen mes: G' + volMes +'\n\n');
                printport.write('Dinero dia:  $' + dineroDia +'\n');
                printport.write('Dinero sem:  $' + dineroSema +'\n');
                printport.write('Dinero mes:  $' + dineroMes +'\n\n'); 
            }
            if(serial !='0000000000000000'){
                printport.write('Empresa:\n');
                printport.write(String(nombreCuenta) + '\n');
                printport.write('Direccion:\n');
                printport.write(direccion+'\n');
                printport.write('Telefono:\n');
                printport.write(telefono+'\n');
                printport.write('\n');
                printport.write('Serial:\n');
                if(printrec == 0){
                    printport.write(serial + '\n\n'); /*global serial*/    
                }
                if(printrec == 1){
                    printport.write(serialrec + '\n\n'); /*global serial*/
                }
                if(printrec == 2){
                    printport.write(serial + '\n\n'); /*global serial*/    
                }
                printport.write('Placa: ' + placa +'\n');
                printport.write('Km   : ' + km +'\n');/*global km*/
                if(imprime_saldo == 1){        
                    printport.write('Saldo: $' + saldo + '\n\n');
                }
            }
            
            printport.write('Posicion: ' + cara + '\n');
            printport.write('Producto: ');
            switch(idproducto){
                case '1':
                   printport.write('Diesel\n'); 
                break;
                
                case '2':
                   printport.write('Corriente\n'); 
                break; 
                
                case '3':
                   printport.write('Extra\n'); 
                break; 
                
                case '4':
                   printport.write('Supreme Diesel\n'); 
                break;                 
            }
            var precio1;
            var dinero1;
            
            if(printrec == 0 ||printrec == 2){
                precio1 = parseFloat(precio);
                volumen[3]=46;
                var volumen1 = parseFloat(volumen);
                printport.write('Volumen : G' + volumen1 + '\n');
                dinero1 = parseFloat(dinero);
            }
            if(printrec == 1){
                precio1 = parseFloat(preciorec);
                printport.write('Volumen : G' + vol_tabla + '\n');
                dinero1 = parseFloat(dinerorec);
            }
            printport.write('PPU     : $' + String(precio1) + '\n');
            printport.write('Dinero  : $' + String(dinero1) + '\n\n\n');
            printport.write('Firma :'+ '\n\n');
            printport.write('       --------------------'+ '\n\n');
            printport.write('Cedula:' + '\n');
            printport.write('       --------------------'+ '\n\n');
            printport.write(footer+ '\n');
            printport.write('\n\n\n\n\n\n\n');   
    }
        else{
            muxport.write('BBB');
            muxport.write('E');
            muxport.write(String(cara));
            muxport.write('3');                         //Error de Operacion
            muxport.write('*');        
            //printport.write('\n\nERROR: \n');
            
            
            
    
            switch(codigoError){
                case 0:                                         //C�digos de error enviados por Autogas
                   printport.write('\n�XITO\n'); 
                break; 
                case 100:
                   printport.write('\nEL SERIAL DEL VEHICULO  NO EXISTE\n'); 
                break; 
                case 200:
                   printport.write('\nPARAMETROS DE ENTRADA\n'); 
                   printport.write('\nINCORRECTOS\n');                
                break; 
                case 300:
                   printport.write('\nERROR DESCONOCIDO\n'); 
                break; 
                case 350:
                   printport.write('\nVEHICULO CONSUMIENDO\n'); 
                break;
                case 400:
                   printport.write('\nCUENTA SIN CUPO\n'); 
                break; 
                case 501:
                   printport.write('\nVEHICULO NO TIENE VOLUMEN AL DIA\n'); 
                break; 
                case 502:
                   printport.write('\nVEHICULO NO TIENE VOLUMEN A LA\n'); 
                   printport.write('\nSEMANA\n');               
                break; 
                case 503:
                   printport.write('\nVEHICULO NO TIENE VOLUMEN AL\n'); 
                   printport.write('\nMES\n');                
                break; 
                case 601:
                   printport.write('\nVEHICULO NO TIENE VISITAS AL DIA\n'); 
                break; 
                case 602:
                   printport.write('\nVEHICULO NO TIENE VISITAS A LA\n'); 
                   printport.write('\nSEMANA\n');               
                break; 
                case 603:
                   printport.write('\nVEHICULO NO TIENE VISITAS AL MES\n'); 
                break; 
                case 701:
                   printport.write('\nVEHICULO NO TIENE DINERO AL DIA\n'); 
                break; 
                case 702:
                   printport.write('\nVEHICULO NO TIENE DINERO A LA\n'); 
                   printport.write('\nSEMANA\n');                
                break; 
                case 703:
                   printport.write('\nVEHICULO NO TIENE DINERO AL MES\n'); 
                break; 
                case 801:
                   printport.write('\nVEHICULO NO PUEDE TANQUEAR EN\n'); 
                   printport.write('\nESTA HORA\n'); 
                break; 
                case 901:
                   printport.write('\nVEHICULO NO PUEDE TANQUEAR EN \n');
                   printport.write('\nESTA EDS\n'); 
                break; 
                case 1001:
                   printport.write('\nVEHICULO NO PUEDE TANQUEAR EL\n'); 
                   printport.write('\nPRODUCTO SELECCIONADO\n');                
                break; 
                case 1101:
                   printport.write('\nLA CUENTA SE ENCUENTRA EN\n'); 
                   printport.write('\nESTADO BLOQUEADO\n');                
                break; 
                case 1102:
                   printport.write('\nLA CUENTA  SE ENCUENTRA  EN UNA\n'); 
                   printport.write('\nFECHA VENCIDA\n');                
                break; 
                case 1201:
                   printport.write('\nEL VEHICULO SE ENCUENTRA EN\n'); 
                   printport.write('\nESTADO BLOQUEADO\n'); 
                break; 
                case 1302:
                   printport.write('\nLA EDS NO ES VALIDA\n'); 
                break; 
                case 1401:
                   printport.write('\nEL KILOMETRAJE INGRESADO ES\n'); 
                   printport.write('\nINFERIOR AL ULTIMO INGRESADO\n');                
                break; 
                case 1501:
                   printport.write('\nEL VOLUMEN SUPERA LA CAPACIDAD\n'); 
                   printport.write('\nDEL TANQUE DEL VEHICULO\n'); 
                break;             
            }
            
            if(codigoError == '2002'|| codigoError ==undefined || codigoError == 200){ //Impresi�n de venta autorizada 
                //printport.write('CODIGO DE ERROR: ');
                //printport.write(String(codigoError)); 
                printport.write('\n\n\n\n\n');
                printport.write('  '+linea1 +'\n');
                printport.write('   '+linea2 +'\n');
                printport.write('      '+nit+'\n');
                printport.write('      Tel: '+tel+'\n');
                printport.write('  '+dir+ '\n\n');
                printport.write('Numero: ' +parseInt(idestacion+id_venta,10)+ '\n\n');
                f = new Date();
                printport.write('Fecha:' + String(f.getDate() + "-" + (f.getMonth() + 1) + "-" + f.getFullYear() + ' ' + f.getHours() + ':' + f.getMinutes()) + '\n\n');                                                      
                codigoError = '0';
                b_enviada = 'TRUE';
                if(imprime_contadores == 1){         
                    printport.write('Visitas: ' + visitasDia + 'd  ' + visitasSema + 's  ' + visitasMes + 'm  ' + '\n\n\n');
                    printport.write('Volumen dia: G' + volDia +'\n');
                    printport.write('Volumen sem: G' + volSema +'\n');
                    printport.write('Volumen mes: G' + volMes +'\n\n');
                    printport.write('Dinero dia:  $' + dineroDia +'\n');
                    printport.write('Dinero sem:  $' + dineroSema +'\n');
                    printport.write('Dinero mes:  $' + dineroMes +'\n\n'); 
                }
                if(serial !='0000000000000000'){
                    printport.write('Empresa:\n');
                    printport.write(String(nombreCuenta) + '\n');
                    printport.write('Direccion:\n');
                    printport.write(direccion+'\n');
                    printport.write('Telefono:\n');
                    printport.write(telefono+'\n');
                    printport.write('\n');
                    printport.write('Serial:\n');
                    printport.write(serial + '\n\n'); /*global serial*/
                    printport.write('Placa: ' + placa +'\n');
                    printport.write('Km   : ' + km +'\n');/*global km*/
                    if(imprime_saldo == 1){        
                        printport.write('Saldo: $' + saldo + '\n\n');
                    }
                }
                
                printport.write('Posicion: ' + cara + '\n'); /*global cara*/
                printport.write('Producto: ');
                switch(idproducto){
                    case '1':
                       printport.write('Diesel\n'); 
                    break;
                    
                    case '2':
                       printport.write('Corriente\n'); 
                    break; 
                    
                    case '3':
                       printport.write('Extra\n'); 
                    break; 
                    
                    case '4':
                       printport.write('Supreme Diesel\n'); 
                    break;                 
                }
                precio1 = parseFloat(precio);/*global precio*/
                printport.write('PPU     : $' + String(precio1) + '\n');
                volumen[3]=46;
                volumen1 = parseFloat(volumen); /*global volumen*/
                printport.write('Volumen : G' + volumen1 + '\n');
                dinero1 = parseFloat(dinero); /*global dinero*/
                printport.write('Dinero  : $' + String(dinero1) + '\n\n\n');
                printport.write('Firma :'+ '\n\n');
                printport.write('       --------------------'+ '\n\n');
                printport.write('Cedula:' + '\n');
                printport.write('       --------------------'+ '\n\n');
                printport.write(footer+ '\n');
                printport.write('\n\n\n\n\n\n\n'); 
            }
            //mod ayer
    } 
        console.log("FIN IMPRIMIENDO");
        imp =1;
    }
}



/*
*********************************************************************************************************
*                                function print_ventaSeg()
*
* Description : Envia los datos para imprimir la venta
*               
*********************************************************************************************************
*/

function print_ventaSeg(){
    console.log("IMPRIMIENDO 2");
    console.log(codigoError);
    if(imp2 == 0){
        if(codigoError == '0'){
            muxport.write('BBB');
            muxport.write('E');
            muxport.write(String(cara));
            muxport.write('2');                         //Gracias por su compra
            muxport.write('*');        
            console.log("RECIBO");
            console.log('\n\n');
            printport.write('  '+linea1 +'\n');
            printport.write('   '+linea2 +'\n');
            printport.write('      '+nit+'\n');
            printport.write('      Tel: '+tel+'\n');
            printport.write('  '+dir+ '\n\n');
            if(printrec == 0){
                printport.write('Numero: ' +parseInt(idestacion+id_venta,10)+ '\n\n');
            }
            if(printrec == 1){
                printport.write('Numero: ' +id_ventarec+ '\n\n');
            }
            if(printrec == 2){
                printport.write('Numero: ' +id_venta+ '\n\n');
            }
            var f = new Date();
            printport.write('Fecha:' + String(f.getDate() + "-" + (f.getMonth() + 1) + "-" + f.getFullYear() + ' ' + f.getHours() + ':' + f.getMinutes()) + '\n\n');                                                      
            if(imprime_contadores == 1){         
                printport.write('Visitas: ' + visitasDia + 'd  ' + visitasSema + 's  ' + visitasMes + 'm  ' + '\n\n\n');
                printport.write('Volumen dia: G' + volDia +'\n');
                printport.write('Volumen sem: G' + volSema +'\n');
                printport.write('Volumen mes: G' + volMes +'\n\n');
                printport.write('Dinero dia:  $' + dineroDia +'\n');
                printport.write('Dinero sem:  $' + dineroSema +'\n');
                printport.write('Dinero mes:  $' + dineroMes +'\n\n'); 
            }
            if(serial !='0000000000000000'){
                printport.write('Empresa:\n');
                printport.write(String(nombreCuenta) + '\n');
                printport.write('Direccion:\n');
                printport.write(direccion+'\n');
                printport.write('Telefono:\n');
                printport.write(telefono+'\n');
                printport.write('\n');
                printport.write('Serial:\n');
                if(printrec == 0||printrec == 2 ){
                    printport.write(serial + '\n\n'); /*global serial*/    
                }else{
                    printport.write(serialrec + '\n\n'); /*global serial*/
                }
                printport.write('Placa: ' + placa +'\n');
                printport.write('Km   : ' + km +'\n');/*global km*/
                if(imprime_saldo == 1){        
                    printport.write('Saldo: $' + saldo + '\n\n');
                }
            }
            
            printport.write('Posicion: ' + cara + '\n');
            printport.write('Producto: ');
            switch(idproducto){
                case '1':
                   printport.write('Diesel\n'); 
                break;
                
                case '2':
                   printport.write('Corriente\n'); 
                break; 
                
                case '3':
                   printport.write('Extra\n'); 
                break; 
                
                case '4':
                   printport.write('Supreme Diesel\n'); 
                break;                 
            }
            var precio1;
            var dinero1;
            
            if(printrec == 0 || printrec == 2){
                precio1 = parseFloat(precio);
                volumen[3]=46;
                var volumen1 = parseFloat(volumen);
                printport.write('Volumen : G' + volumen1 + '\n');
                dinero1 = parseFloat(dinero);
            }
            if(printrec == 1){
                precio1 = parseFloat(preciorec);
                printport.write('Volumen : G' + vol_tabla + '\n');
                dinero1 = parseFloat(dinerorec);
            }
            printport.write('PPU     : $' + String(precio1) + '\n');
            printport.write('Dinero  : $' + String(dinero1) + '\n\n\n');
            printport.write('Firma :'+ '\n\n');
            printport.write('       --------------------'+ '\n\n');
            printport.write('Cedula:' + '\n');
            printport.write('       --------------------'+ '\n\n');
            printport.write(footer+ '\n');
            printport.write('\n\n\n\n\n\n\n');   
        }
        else{
            muxport.write('BBB');
            muxport.write('E');
            muxport.write(String(cara));
            muxport.write('3');                         //Error de Operacion
            muxport.write('*');        
            //printport.write('\n\nERROR: \n');
            
            
            
    
            switch(codigoError){
                case 0:                                         //C�digos de error enviados por Autogas
                   printport.write('\n�XITO\n'); 
                break; 
                case 100:
                   printport.write('\nEL SERIAL DEL VEHICULO  NO EXISTE\n'); 
                break; 
                case 200:
                   printport.write('\nPARAMETROS DE ENTRADA\n'); 
                   printport.write('\nINCORRECTOS\n');                
                break; 
                case 300:
                   printport.write('\nERROR DESCONOCIDO\n'); 
                break; 
                case 350:
                   printport.write('\nVEHICULO CONSUMIENDO\n'); 
                break;
                case 400:
                   printport.write('\nCUENTA SIN CUPO\n'); 
                break; 
                case 501:
                   printport.write('\nVEHICULO NO TIENE VOLUMEN AL DIA\n'); 
                break; 
                case 502:
                   printport.write('\nVEHICULO NO TIENE VOLUMEN A LA\n'); 
                   printport.write('\nSEMANA\n');               
                break; 
                case 503:
                   printport.write('\nVEHICULO NO TIENE VOLUMEN AL\n'); 
                   printport.write('\nMES\n');                
                break; 
                case 601:
                   printport.write('\nVEHICULO NO TIENE VISITAS AL DIA\n'); 
                break; 
                case 602:
                   printport.write('\nVEHICULO NO TIENE VISITAS A LA\n'); 
                   printport.write('\nSEMANA\n');               
                break; 
                case 603:
                   printport.write('\nVEHICULO NO TIENE VISITAS AL MES\n'); 
                break; 
                case 701:
                   printport.write('\nVEHICULO NO TIENE DINERO AL DIA\n'); 
                break; 
                case 702:
                   printport.write('\nVEHICULO NO TIENE DINERO A LA\n'); 
                   printport.write('\nSEMANA\n');                
                break; 
                case 703:
                   printport.write('\nVEHICULO NO TIENE DINERO AL MES\n'); 
                break; 
                case 801:
                   printport.write('\nVEHICULO NO PUEDE TANQUEAR EN\n'); 
                   printport.write('\nESTA HORA\n'); 
                break; 
                case 901:
                   printport.write('\nVEHICULO NO PUEDE TANQUEAR EN \n');
                   printport.write('\nESTA EDS\n'); 
                break; 
                case 1001:
                   printport.write('\nVEHICULO NO PUEDE TANQUEAR EL\n'); 
                   printport.write('\nPRODUCTO SELECCIONADO\n');                
                break; 
                case 1101:
                   printport.write('\nLA CUENTA SE ENCUENTRA EN\n'); 
                   printport.write('\nESTADO BLOQUEADO\n');                
                break; 
                case 1102:
                   printport.write('\nLA CUENTA  SE ENCUENTRA  EN UNA\n'); 
                   printport.write('\nFECHA VENCIDA\n');                
                break; 
                case 1201:
                   printport.write('\nEL VEHICULO SE ENCUENTRA EN\n'); 
                   printport.write('\nESTADO BLOQUEADO\n'); 
                break; 
                case 1302:
                   printport.write('\nLA EDS NO ES VALIDA\n'); 
                break; 
                case 1401:
                   printport.write('\nEL KILOMETRAJE INGRESADO ES\n'); 
                   printport.write('\nINFERIOR AL ULTIMO INGRESADO\n');                
                break; 
                case 1501:
                   printport.write('\nEL VOLUMEN SUPERA LA CAPACIDAD\n'); 
                   printport.write('\nDEL TANQUE DEL VEHICULO\n'); 
                break;             
            }
            
            if(codigoError == '2002'|| codigoError ==undefined || codigoError == 200){ //Impresi�n de venta autorizada 
                //printport.write('CODIGO DE ERROR: ');
                //printport.write(String(codigoError)); 
                printport.write('\n\n\n\n\n');
                printport.write('  '+linea1 +'\n');
                printport.write('   '+linea2 +'\n');
                printport.write('      '+nit+'\n');
                printport.write('      Tel: '+tel+'\n');
                printport.write('  '+dir+ '\n\n');
                printport.write('Numero: ' +parseInt(idestacion+id_venta,10)+ '\n\n');
                f = new Date();
                printport.write('Fecha:' + String(f.getDate() + "-" + (f.getMonth() + 1) + "-" + f.getFullYear() + ' ' + f.getHours() + ':' + f.getMinutes()) + '\n\n');                                                      
                codigoError = '0';
                b_enviada = 'TRUE';
                if(imprime_contadores == 1){         
                    printport.write('Visitas: ' + visitasDia + 'd  ' + visitasSema + 's  ' + visitasMes + 'm  ' + '\n\n\n');
                    printport.write('Volumen dia: G' + volDia +'\n');
                    printport.write('Volumen sem: G' + volSema +'\n');
                    printport.write('Volumen mes: G' + volMes +'\n\n');
                    printport.write('Dinero dia:  $' + dineroDia +'\n');
                    printport.write('Dinero sem:  $' + dineroSema +'\n');
                    printport.write('Dinero mes:  $' + dineroMes +'\n\n'); 
                }
                if(serial !='0000000000000000'){
                    printport.write('Empresa:\n');
                    printport.write(String(nombreCuenta) + '\n');
                    printport.write('Direccion:\n');
                    printport.write(direccion+'\n');
                    printport.write('Telefono:\n');
                    printport.write(telefono+'\n');
                    printport.write('\n');
                    printport.write('Serial:\n');
                    printport.write(serial + '\n\n'); /*global serial*/
                    printport.write('Placa: ' + placa +'\n');
                    printport.write('Km   : ' + km +'\n');/*global km*/
                    if(imprime_saldo == 1){        
                        printport.write('Saldo: $' + saldo + '\n\n');
                    }
                }
                
                printport.write('Posicion: ' + cara + '\n'); /*global cara*/
                printport.write('Producto: ');
                switch(idproducto){
                    case '1':
                       printport.write('Diesel\n'); 
                    break;
                    
                    case '2':
                       printport.write('Corriente\n'); 
                    break; 
                    
                    case '3':
                       printport.write('Extra\n'); 
                    break; 
                    
                    case '4':
                       printport.write('Supreme Diesel\n'); 
                    break;                 
                }
                precio1 = parseFloat(precio);/*global precio*/
                printport.write('PPU     : $' + String(precio1) + '\n');
                volumen[3]=46;
                volumen1 = parseFloat(volumen); /*global volumen*/
                printport.write('Volumen : G' + volumen1 + '\n');
                dinero1 = parseFloat(dinero); /*global dinero*/
                printport.write('Dinero  : $' + String(dinero1) + '\n\n\n');
                printport.write('Firma :'+ '\n\n');
                printport.write('       --------------------'+ '\n\n');
                printport.write('Cedula:' + '\n');
                printport.write('       --------------------'+ '\n\n');
                printport.write(footer+ '\n');
                printport.write('\n\n\n\n\n\n\n'); 
            }
            //mod ayer
        } 
        console.log("FIN IMPRIMIENDO");
        imp2 =1;
    }
    
}

/*
*********************************************************************************************************
*                                function print_ventaInt()
*
* Description : Envia los datos para imprimir la venta
*               
*********************************************************************************************************
*/


function print_ventaInt(){
    console.log("IMPRIMIENDO INTERNET 1");
    console.log(codigoError);
    if(imp == 0){                
        if(codigoError == '0'){
            muxport.write('BBB');
            muxport.write('E');
            muxport.write(String(caraint));
            muxport.write('2');                         //Gracias por su compra
            muxport.write('*');        
            console.log("RECIBO");
            console.log('\n\n');
            printport.write('  '+linea1 +'\n');
            printport.write('   '+linea2 +'\n');
            printport.write('      '+nit+'\n');
            printport.write('      Tel: '+tel+'\n');
            printport.write('  '+dir+ '\n\n');           
			printport.write('Numero: ' +parseInt(idestacionint+id_ventaint,10)+ '\n\n');            
            
            var f = new Date();
            printport.write('Fecha:' + String(f.getDate() + "-" + (f.getMonth() + 1) + "-" + f.getFullYear() + ' ' + f.getHours() + ':' + f.getMinutes()) + '\n\n');                                                      
            if(imprime_contadores == 1){         
                printport.write('Visitas: ' + visitasDia + 'd  ' + visitasSema + 's  ' + visitasMes + 'm  ' + '\n\n\n');
                printport.write('Volumen dia: G' + volDia +'\n');
                printport.write('Volumen sem: G' + volSema +'\n');
                printport.write('Volumen mes: G' + volMes +'\n\n');
                printport.write('Dinero dia:  $' + dineroDia +'\n');
                printport.write('Dinero sem:  $' + dineroSema +'\n');
                printport.write('Dinero mes:  $' + dineroMes +'\n\n'); 
            }
            if(serial !='0000000000000000'){
                printport.write('Empresa:\n');
                printport.write(String(nombreCuentaint) + '\n');
                printport.write('Direccion:\n');
                printport.write(direccionint+'\n');
                printport.write('Telefono:\n');
                printport.write(telefonoint+'\n');
                printport.write('\n');
                printport.write('Serial:\n');                
                printport.write(serialint + '\n\n'); /*global serial*/                                   
                printport.write('Placa: ' + placaint +'\n');
                printport.write('Km   : ' + kmint +'\n');/*global km*/
                if(imprime_saldo == 1){        
                    printport.write('Saldo: $' + saldo + '\n\n');
                }
            }            
            printport.write('Posicion: ' + caraint + '\n');
            printport.write('Producto: ');
            switch(idproducto){
                case '1':
                   printport.write('Diesel\n'); 
                break;
                
                case '2':
                   printport.write('Corriente\n'); 
                break; 
                
                case '3':
                   printport.write('Extra\n'); 
                break; 
                
                case '4':
                   printport.write('Supreme Diesel\n'); 
                break;                 
            }
            var precio1;
            var dinero1;                       
			precio1 = parseFloat(precioint);
			printport.write('Volumen : G' + volumenint + '\n');
			dinero1 = parseFloat(dineroint);            
            printport.write('PPU     : $' + String(precio1) + '\n');
            printport.write('Dinero  : $' + String(dinero1) + '\n\n\n');
            printport.write('Firma :'+ '\n\n');
            printport.write('       --------------------'+ '\n\n');
            printport.write('Cedula:' + '\n');
            printport.write('       --------------------'+ '\n\n');
            printport.write(footer+ '\n');
            printport.write('\n\n\n\n\n\n\n');   
		}
        else{
            muxport.write('BBB');
            muxport.write('E');
            muxport.write(String(caraint));
            muxport.write('3');                         //Error de Operacion
            muxport.write('*');        
            //printport.write('\n\nERROR: \n');
            
            
            
    
            switch(codigoError){
                case 0:                                         //C�digos de error enviados por Autogas
                   printport.write('\n�XITO\n'); 
                break; 
                case 100:
                   printport.write('\nEL SERIAL DEL VEHICULO  NO EXISTE\n'); 
                break; 
                case 200:
                   printport.write('\nPARAMETROS DE ENTRADA\n'); 
                   printport.write('\nINCORRECTOS\n');                
                break; 
                case 300:
                   printport.write('\nERROR DESCONOCIDO\n'); 
                break; 
                case 350:
                   printport.write('\nVEHICULO CONSUMIENDO\n'); 
                break;
                case 400:
                   printport.write('\nCUENTA SIN CUPO\n'); 
                break; 
                case 501:
                   printport.write('\nVEHICULO NO TIENE VOLUMEN AL DIA\n'); 
                break; 
                case 502:
                   printport.write('\nVEHICULO NO TIENE VOLUMEN A LA\n'); 
                   printport.write('\nSEMANA\n');               
                break; 
                case 503:
                   printport.write('\nVEHICULO NO TIENE VOLUMEN AL\n'); 
                   printport.write('\nMES\n');                
                break; 
                case 601:
                   printport.write('\nVEHICULO NO TIENE VISITAS AL DIA\n'); 
                break; 
                case 602:
                   printport.write('\nVEHICULO NO TIENE VISITAS A LA\n'); 
                   printport.write('\nSEMANA\n');               
                break; 
                case 603:
                   printport.write('\nVEHICULO NO TIENE VISITAS AL MES\n'); 
                break; 
                case 701:
                   printport.write('\nVEHICULO NO TIENE DINERO AL DIA\n'); 
                break; 
                case 702:
                   printport.write('\nVEHICULO NO TIENE DINERO A LA\n'); 
                   printport.write('\nSEMANA\n');                
                break; 
                case 703:
                   printport.write('\nVEHICULO NO TIENE DINERO AL MES\n'); 
                break; 
                case 801:
                   printport.write('\nVEHICULO NO PUEDE TANQUEAR EN\n'); 
                   printport.write('\nESTA HORA\n'); 
                break; 
                case 901:
                   printport.write('\nVEHICULO NO PUEDE TANQUEAR EN \n');
                   printport.write('\nESTA EDS\n'); 
                break; 
                case 1001:
                   printport.write('\nVEHICULO NO PUEDE TANQUEAR EL\n'); 
                   printport.write('\nPRODUCTO SELECCIONADO\n');                
                break; 
                case 1101:
                   printport.write('\nLA CUENTA SE ENCUENTRA EN\n'); 
                   printport.write('\nESTADO BLOQUEADO\n');                
                break; 
                case 1102:
                   printport.write('\nLA CUENTA  SE ENCUENTRA  EN UNA\n'); 
                   printport.write('\nFECHA VENCIDA\n');                
                break; 
                case 1201:
                   printport.write('\nEL VEHICULO SE ENCUENTRA EN\n'); 
                   printport.write('\nESTADO BLOQUEADO\n'); 
                break; 
                case 1302:
                   printport.write('\nLA EDS NO ES VALIDA\n'); 
                break; 
                case 1401:
                   printport.write('\nEL KILOMETRAJE INGRESADO ES\n'); 
                   printport.write('\nINFERIOR AL ULTIMO INGRESADO\n');                
                break; 
                case 1501:
                   printport.write('\nEL VOLUMEN SUPERA LA CAPACIDAD\n'); 
                   printport.write('\nDEL TANQUE DEL VEHICULO\n'); 
                break;             
            }
            
            if(codigoError == '2002'|| codigoError ==undefined || codigoError == 200 || codigoError == '2001'){ //Impresi�n de venta autorizada                 
                //printport.write('CODIGO DE ERROR: ');
                //printport.write(String(codigoError));
                b_enviada = 'TRUE';
                printport.write('\n\n\n\n\n');
                printport.write('  '+linea1 +'\n');
                printport.write('   '+linea2 +'\n');
                printport.write('      '+nit+'\n');
                printport.write('      Tel: '+tel+'\n');
                printport.write('  '+dir+ '\n\n');
                printport.write('Numero: ' +parseInt(idestacionint+id_ventaint,10)+ '\n\n');
                f = new Date();
                printport.write('Fecha:' + String(f.getDate() + "-" + (f.getMonth() + 1) + "-" + f.getFullYear() + ' ' + f.getHours() + ':' + f.getMinutes()) + '\n\n');                                                      
                if(imprime_contadores == 1){         
                    printport.write('Visitas: ' + visitasDia + 'd  ' + visitasSema + 's  ' + visitasMes + 'm  ' + '\n\n\n');
                    printport.write('Volumen dia: G' + volDia +'\n');
                    printport.write('Volumen sem: G' + volSema +'\n');
                    printport.write('Volumen mes: G' + volMes +'\n\n');
                    printport.write('Dinero dia:  $' + dineroDia +'\n');
                    printport.write('Dinero sem:  $' + dineroSema +'\n');
                    printport.write('Dinero mes:  $' + dineroMes +'\n\n'); 
                }
                if(serial !='0000000000000000'){
                    printport.write('Empresa:\n');
                    printport.write(String(nombreCuentaint) + '\n');
                    printport.write('Direccion:\n');
                    printport.write(direccionint+'\n');
                    printport.write('Telefono:\n');
                    printport.write(telefonoint+'\n');
                    printport.write('\n');
                    printport.write('Serial:\n');
                    printport.write(serialint + '\n\n'); /*global serial*/
                    printport.write('Placa: ' + placaint +'\n');
                    printport.write('Km   : ' + kmint +'\n');/*global km*/
                    if(imprime_saldo == 1){        
                        printport.write('Saldo: $' + saldo + '\n\n');
                    }
                }
                
                printport.write('Posicion: ' + caraint + '\n'); /*global cara*/
                printport.write('Producto: ');
                switch(idproducto){
                    case '1':
                       printport.write('Diesel\n'); 
                    break;
                    
                    case '2':
                       printport.write('Corriente\n'); 
                    break; 
                    
                    case '3':
                       printport.write('Extra\n'); 
                    break; 
                    
                    case '4':
                       printport.write('Supreme Diesel\n'); 
                    break;                 
                }
                precio1 = parseFloat(precioint);/*global precio*/
                printport.write('PPU     : $' + String(precio1) + '\n');
                volumen[3]=46;
                var volumen1;
                volumen1 = parseFloat(volumenint); /*global volumen*/
                printport.write('Volumen : G' + volumen1 + '\n');
                dinero1 = parseFloat(dineroint); /*global dinero*/
                printport.write('Dinero  : $' + String(dinero1) + '\n\n\n');
                printport.write('Firma :'+ '\n\n');
                printport.write('       --------------------'+ '\n\n');
                printport.write('Cedula:' + '\n');
                printport.write('       --------------------'+ '\n\n');
                printport.write(footer+ '\n');
                printport.write('\n\n\n\n\n\n\n'); 
            }
            //mod ayer
		} 
        console.log("FIN IMPRIMIENDO");
        imp =1;
    }
}



/*
*********************************************************************************************************
*                                function print_ventaInt()
*
* Description : Envia los datos para imprimir la venta
*               
*********************************************************************************************************
*/


function print_ventaIntSeg(){
    console.log("IMPRIMIENDO INTERNET 2");
    console.log(codigoError);
    if(imp == 0){                
        if(codigoError == '0'){
            muxport.write('BBB');
            muxport.write('E');
            muxport.write(String(caraint));
            muxport.write('2');                         //Gracias por su compra
            muxport.write('*');        
            console.log("RECIBO");
            console.log('\n\n');
            printport.write('  '+linea1 +'\n');
            printport.write('   '+linea2 +'\n');
            printport.write('      '+nit+'\n');
            printport.write('      Tel: '+tel+'\n');
            printport.write('  '+dir+ '\n\n');           
			printport.write('Numero: ' +parseInt(idestacionint+id_ventaint,10)+ '\n\n');            
            
            var f = new Date();
            printport.write('Fecha:' + String(f.getDate() + "-" + (f.getMonth() + 1) + "-" + f.getFullYear() + ' ' + f.getHours() + ':' + f.getMinutes()) + '\n\n');                                                      
            if(imprime_contadores == 1){         
                printport.write('Visitas: ' + visitasDia + 'd  ' + visitasSema + 's  ' + visitasMes + 'm  ' + '\n\n\n');
                printport.write('Volumen dia: G' + volDia +'\n');
                printport.write('Volumen sem: G' + volSema +'\n');
                printport.write('Volumen mes: G' + volMes +'\n\n');
                printport.write('Dinero dia:  $' + dineroDia +'\n');
                printport.write('Dinero sem:  $' + dineroSema +'\n');
                printport.write('Dinero mes:  $' + dineroMes +'\n\n'); 
            }
            if(serial !='0000000000000000'){
                printport.write('Empresa:\n');
                printport.write(String(nombreCuentaint) + '\n');
                printport.write('Direccion:\n');
                printport.write(direccionint+'\n');
                printport.write('Telefono:\n');
                printport.write(telefonoint+'\n');
                printport.write('\n');
                printport.write('Serial:\n');                
                printport.write(serialint + '\n\n'); /*global serial*/                                   
                printport.write('Placa: ' + placaint +'\n');
                printport.write('Km   : ' + kmint +'\n');/*global km*/
                if(imprime_saldo == 1){        
                    printport.write('Saldo: $' + saldo + '\n\n');
                }
            }            
            printport.write('Posicion: ' + caraint + '\n');
            printport.write('Producto: ');
            switch(idproducto){
                case '1':
                   printport.write('Diesel\n'); 
                break;
                
                case '2':
                   printport.write('Corriente\n'); 
                break; 
                
                case '3':
                   printport.write('Extra\n'); 
                break; 
                
                case '4':
                   printport.write('Supreme Diesel\n'); 
                break;                 
            }
            var precio1;
            var dinero1;                       
			precio1 = parseFloat(precioint);
			printport.write('Volumen : G' + volumenint + '\n');
			dinero1 = parseFloat(dineroint);            
            printport.write('PPU     : $' + String(precio1) + '\n');
            printport.write('Dinero  : $' + String(dinero1) + '\n\n\n');
            printport.write('Firma :'+ '\n\n');
            printport.write('       --------------------'+ '\n\n');
            printport.write('Cedula:' + '\n');
            printport.write('       --------------------'+ '\n\n');
            printport.write(footer+ '\n');
            printport.write('\n\n\n\n\n\n\n');   
		}
        else{
            muxport.write('BBB');
            muxport.write('E');
            muxport.write(String(caraint));
            muxport.write('3');                         //Error de Operacion
            muxport.write('*');        
            //printport.write('\n\nERROR: \n');
            
            
            
    
            switch(codigoError){
                case 0:                                         //C�digos de error enviados por Autogas
                   printport.write('\n�XITO\n'); 
                break; 
                case 100:
                   printport.write('\nEL SERIAL DEL VEHICULO  NO EXISTE\n'); 
                break; 
                case 200:
                   printport.write('\nPARAMETROS DE ENTRADA\n'); 
                   printport.write('\nINCORRECTOS\n');                
                break; 
                case 300:
                   printport.write('\nERROR DESCONOCIDO\n'); 
                break;
                case 350:
                   printport.write('\nVEHICULO CONSUMIENDO\n'); 
                break;
                case 400:
                   printport.write('\nCUENTA SIN CUPO\n'); 
                break; 
                case 501:
                   printport.write('\nVEHICULO NO TIENE VOLUMEN AL DIA\n'); 
                break; 
                case 502:
                   printport.write('\nVEHICULO NO TIENE VOLUMEN A LA\n'); 
                   printport.write('\nSEMANA\n');               
                break; 
                case 503:
                   printport.write('\nVEHICULO NO TIENE VOLUMEN AL\n'); 
                   printport.write('\nMES\n');                
                break; 
                case 601:
                   printport.write('\nVEHICULO NO TIENE VISITAS AL DIA\n'); 
                break; 
                case 602:
                   printport.write('\nVEHICULO NO TIENE VISITAS A LA\n'); 
                   printport.write('\nSEMANA\n');               
                break; 
                case 603:
                   printport.write('\nVEHICULO NO TIENE VISITAS AL MES\n'); 
                break; 
                case 701:
                   printport.write('\nVEHICULO NO TIENE DINERO AL DIA\n'); 
                break; 
                case 702:
                   printport.write('\nVEHICULO NO TIENE DINERO A LA\n'); 
                   printport.write('\nSEMANA\n');                
                break; 
                case 703:
                   printport.write('\nVEHICULO NO TIENE DINERO AL MES\n'); 
                break; 
                case 801:
                   printport.write('\nVEHICULO NO PUEDE TANQUEAR EN\n'); 
                   printport.write('\nESTA HORA\n'); 
                break; 
                case 901:
                   printport.write('\nVEHICULO NO PUEDE TANQUEAR EN \n');
                   printport.write('\nESTA EDS\n'); 
                break; 
                case 1001:
                   printport.write('\nVEHICULO NO PUEDE TANQUEAR EL\n'); 
                   printport.write('\nPRODUCTO SELECCIONADO\n');                
                break; 
                case 1101:
                   printport.write('\nLA CUENTA SE ENCUENTRA EN\n'); 
                   printport.write('\nESTADO BLOQUEADO\n');                
                break; 
                case 1102:
                   printport.write('\nLA CUENTA  SE ENCUENTRA  EN UNA\n'); 
                   printport.write('\nFECHA VENCIDA\n');                
                break; 
                case 1201:
                   printport.write('\nEL VEHICULO SE ENCUENTRA EN\n'); 
                   printport.write('\nESTADO BLOQUEADO\n'); 
                break; 
                case 1302:
                   printport.write('\nLA EDS NO ES VALIDA\n'); 
                break; 
                case 1401:
                   printport.write('\nEL KILOMETRAJE INGRESADO ES\n'); 
                   printport.write('\nINFERIOR AL ULTIMO INGRESADO\n');                
                break; 
                case 1501:
                   printport.write('\nEL VOLUMEN SUPERA LA CAPACIDAD\n'); 
                   printport.write('\nDEL TANQUE DEL VEHICULO\n'); 
                break;             
            }
            
            if(codigoError == '2002'|| codigoError ==undefined || codigoError == 200){ //Impresi�n de venta autorizada                 
                //printport.write('CODIGO DE ERROR: ');
                //printport.write(String(codigoError)); 
                printport.write('\n\n\n\n\n');
                printport.write('  '+linea1 +'\n');
                printport.write('   '+linea2 +'\n');
                printport.write('      '+nit+'\n');
                printport.write('      Tel: '+tel+'\n');
                printport.write('  '+dir+ '\n\n');
                printport.write('Numero: ' +parseInt(idestacionint+id_ventaint,10)+ '\n\n');
                f = new Date();
                printport.write('Fecha:' + String(f.getDate() + "-" + (f.getMonth() + 1) + "-" + f.getFullYear() + ' ' + f.getHours() + ':' + f.getMinutes()) + '\n\n');                                                      
                codigoError = '0';
                b_enviada = 'TRUE';
                if(imprime_contadores == 1){         
                    printport.write('Visitas: ' + visitasDia + 'd  ' + visitasSema + 's  ' + visitasMes + 'm  ' + '\n\n\n');
                    printport.write('Volumen dia: G' + volDia +'\n');
                    printport.write('Volumen sem: G' + volSema +'\n');
                    printport.write('Volumen mes: G' + volMes +'\n\n');
                    printport.write('Dinero dia:  $' + dineroDia +'\n');
                    printport.write('Dinero sem:  $' + dineroSema +'\n');
                    printport.write('Dinero mes:  $' + dineroMes +'\n\n'); 
                }
                if(serial !='0000000000000000'){
                    printport.write('Empresa:\n');
                    printport.write(String(nombreCuentaint) + '\n');
                    printport.write('Direccion:\n');
                    printport.write(direccionint+'\n');
                    printport.write('Telefono:\n');
                    printport.write(telefonoint+'\n');
                    printport.write('\n');
                    printport.write('Serial:\n');
                    printport.write(serialint + '\n\n'); /*global serial*/
                    printport.write('Placa: ' + placaint +'\n');
                    printport.write('Km   : ' + kmint +'\n');/*global km*/
                    if(imprime_saldo == 1){        
                        printport.write('Saldo: $' + saldoint + '\n\n');
                    }
                }
                
                printport.write('Posicion: ' + caraint + '\n'); /*global cara*/
                printport.write('Producto: ');
                switch(idproducto){
                    case '1':
                       printport.write('Diesel\n'); 
                    break;
                    
                    case '2':
                       printport.write('Corriente\n'); 
                    break; 
                    
                    case '3':
                       printport.write('Extra\n'); 
                    break; 
                    
                    case '4':
                       printport.write('Supreme Diesel\n'); 
                    break;                 
                }
                precio1 = parseFloat(precioint);/*global precio*/
                printport.write('PPU     : $' + String(precio1) + '\n');
                volumen[3]=46;
                volumen1 = parseFloat(volumenint); /*global volumen*/
                printport.write('Volumen : G' + volumen1 + '\n');
                dinero1 = parseFloat(dineroint); /*global dinero*/
                printport.write('Dinero  : $' + String(dinero1) + '\n\n\n');
                printport.write('Firma :'+ '\n\n');
                printport.write('       --------------------'+ '\n\n');
                printport.write('Cedula:' + '\n');
                printport.write('       --------------------'+ '\n\n');
                printport.write(footer+ '\n');
                printport.write('\n\n\n\n\n\n\n'); 
            }
            //mod ayer
		} 
        console.log("FIN IMPRIMIENDO");
        imp =1;
    }
}
/*
*********************************************************************************************************
*                                function actualAuto()
*
* Description : Guarda la venta en la base de datos
*               
*********************************************************************************************************
*/
function actualAuto(){
 //console.log("en la funcion_count");
 if(enable_count==1){
  console.log("contandoL1...");  
      contador=contador-1;
     if(contador==0){
         console.log("!deja de contarL1??");
      enable_count=0;         
     }else{
         actualAuto();
     }
 }
}



/*
*********************************************************************************************************
*                                function enviaInternet()
*
* Description : Guarda la venta en la base de datos
*               
*********************************************************************************************************
*/
function enviaInternet(){
    pg.connect(conString, function(err, client, done){                  //conectar a la base de datos
        if(err){
            return console.error('error conexion save_sale', err);
        }else{
            client.query("SELECT producto,volumen, dinero, precio, idestacion,serial,autorizacion,id_venta,km,fecha, enviada,nombrecuenta,direccion,telefono FROM venta where id = (SELECT MAX(id) FROM venta WHERE cara = '1');", function(err,result){
	            done();
	            if(err){
		        return console.error('error seleccion MAX venta', err);
	            }else{
		            subeInternet = result.rows[0].enviada;
		            console.log("Internet>>" + subeInternet);
		            if (subeInternet){
		                console.log("No hay que subir venta");
		            }else{
		                if(result.rows[0].volumen != null){
		                    caraint         = '1';
					        idproductoint   = result.rows[0].producto;
					        volumenrec      = result.rows[0].volumen;
					        volumenint      = volumenrec.replace('.', ',');
					        dineroint       = result.rows[0].dinero;
					        precioint       = result.rows[0].precio;
					        idestacionint   = result.rows[0].idestacion;
					        serialint       = result.rows[0].serial;
					        kmint           = result.rows[0].km;
					        autorizacionint = result.rows[0].autorizacion;	
					        fechaint        = result.rows[0].fecha;
					        nombreCuentaint = result.rows[0].nombrecuenta;
					        direccionint    = result.rows[0].direccion;
					        telefonoint     = result.rows[0].telefono;
					        id_ventaint     = result.rows[0].id_venta;
					        placaint        = result.rows[0].placa;
					        console.log("Venta recuperada Internet 1: ");
        					console.log("Cara>> "+ caraint);
        					console.log("Producto>> "+ idproductoint);
        					console.log("Volumen>> "+ volumenint);
        					console.log("Dinero>> "+ dineroint);
        					console.log("Precio>> "+ precioint);
        					console.log("ID Estacion>> "+ idestacionint);
        					console.log("Serial>> "+ serialint);
        					console.log("Autorizacion>> "+ autorizacionint);
        					console.log("ID Venta>> "+ id_ventaint);
        					console.log("Fecha>> "+ fechaint);
        					console.log("Cuenta>> "+ nombreCuentaint);
        					console.log("Direccion>> "+ direccionint);
        					console.log("Telefono>> "+ telefonoint);
		                    console.log("Venta por subir cara 1");
		                    imp = 1;
                            rest_sale_internet();   
                            actualAuto();
		                }
		            }
	            }
            });
        }
    }); 
}

/*
*********************************************************************************************************
*                                function enviaInternetSeg()
*
* Description : Guarda la venta en la base de datos
*               
*********************************************************************************************************
*/
function enviaInternetSeg(){
    pg.connect(conString, function(err, client, done){                  //conectar a la base de datos
        if(err){
            return console.error('error conexion save_sale', err);
        }else{
            client.query("SELECT producto,volumen, dinero, precio, idestacion,serial,autorizacion,id_venta,km,fecha,nombrecuenta,direccion,telefono,placa, enviada FROM venta where id = (SELECT MAX(id) FROM venta WHERE cara = '2') ;", function(err,result){
	            done();
	            if(err){
		        return console.error('error seleccion MAX venta', err);
	            }else{
		            subeInternet2 = result.rows[0].enviada;
		            console.log("Internet2>>" + subeInternet2);
		            if (subeInternet2){
		                console.log("No hay que subir venta");
		            }else{
		                if(result.rows[0].volumen != null){
		                    caraint         = '2';
		                    idproductoint   = result.rows[0].producto;
					        volumenrec      = result.rows[0].volumen;
					        volumenint      = volumenrec.replace('.', ',');
					        dineroint       = result.rows[0].dinero;
					        precioint       = result.rows[0].precio;
					        idestacionint   = result.rows[0].idestacion;
					        serialint       = result.rows[0].serial;
					        kmint           = result.rows[0].km;
					        autorizacionint = result.rows[0].autorizacion;	
					        fechaint        = result.rows[0].fecha;
					        nombreCuentaint = result.rows[0].nombrecuenta;
					        direccionint    = result.rows[0].direccion;
					        telefonoint     = result.rows[0].telefono;
					        id_ventaint     = result.rows[0].id_venta;
					        placaint        = result.rows[0].placa;
					        console.log("Venta recuperada Internet 2: ");
        					console.log("Cara>> "+ caraint);
        					console.log("Producto>> "+ idproductoint);
        					console.log("Volumen>> "+ volumenint);
        					console.log("Dinero>> "+ dineroint);
        					console.log("Precio>> "+ precioint);
        					console.log("ID Estacion>> "+ idestacionint);
        					console.log("Serial>> "+ serialint);
        					console.log("Autorizacion>> "+ autorizacionint);
        					console.log("ID Venta>> "+ id_ventaint);
        					console.log("Fecha>> "+ fechaint);
        					console.log("Cuenta>> "+ nombreCuentaint);
        					console.log("Direccion>> "+ direccionint);
        					console.log("Telefono>> "+ telefonoint);
		                    console.log("Venta por subir cara 2");
		                    imp2 = 1;
                            rest_sale_internetSeg();   
                            actualAuto();
		                }
		            }
	            }
            });
        }
    }); 
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
    enviaInternet();
    enviaInternetSeg();
    var f = new Date();
    if((f.getHours()=='14')&&(f.getMinutes()=='44')&&(corte_ok==0)){
        printport.write('MOMENTO DE CORTE\n');
        printport.write('REALICE CIERRE DE TURNO\n');
        printport.write('PARA INICIAR VENTA\n\n\n\n\n\n');              //A la hora programada se ejecuta la funcion para obligar a corte
        printport.write('*** CORTE PROGRAMADO***\n');
        permite  = 0;
        corte_ok = 1;
        console.log('Pregunta');
    }
    else{
        corte_ok=0;
    }
}

/*
*********************************************************************************************************
*                                    Metodos Principales
*********************************************************************************************************
*/

muxport.open(abrir);                    //Abre la comunicacion con el mux
printport.open(abrir_print);            //Abre la comunicacion con el mux
setInterval(watchful, 30000);           //Revisa el estado de las banderas
setInterval(actualAuto,5000);










