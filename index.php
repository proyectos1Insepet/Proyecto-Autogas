<!DOCTYPE html>
<!--
To change this license header, choose License Headers in Project Properties.
To change this template file, choose Tools | Templates
and open the template in the editor.
-->
<html>
 <head>
  <link rel="stylesheet" type="text/css" href="estilo.css">
  <meta charset="UTF-8">
  <script script type="text/javascript" src="form.js"></script>
  <title>Formulario de inicio</title>
 </head>
 <body>
 <header class="header"><!--<img  src="fondo.jpg" width="180" height="119"></br></br>--> Configuración de parámetros de inicio </header>
       
        <?php 
if (isset($_POST['enviar'])) {
   // process form
   $dbconn = pg_connect("host=localhost dbname=autogas user=db_admin password='12345'")
   or die('No se ha podido conectar: ' . \pg_last_error());
   $linea1 = isset($_POST['linea1'])? $_POST['linea1'] : NULL;
   $linea2 = isset($_POST['linea2'])? $_POST['linea2'] : NULL;
   $nit = isset($_POST['nit'])? $_POST['nit'] : NULL;
   $tel = isset($_POST['tel'])? $_POST['tel'] : NULL;
   $dir = isset($_POST['dir'])? $_POST['dir'] : NULL;
   $footer = isset($_POST['footer'])? $_POST['footer'] : NULL;
   $query = "UPDATE recibo SET linea1 = '$linea1', linea2 = '$linea2', nit = '$nit', tel = '$tel', dir = '$dir',  footer = '$footer' ";
   $result = pg_query($query) or die('La consulta fallo: ' . \pg_last_error());
   // Liberando el conjunto de resultados
   pg_free_result($result);
   // Cerrando la conexión
   pg_close($dbconn);
   echo "¡Gracias! Hemos recibido sus datos.\n"; 
}else{
?> 
  
 <div id="form-main">
  <div id="form-div">
      <form class="form" id="form" action="index2.php" method="post">
      
      <p class="name">
        <input name="linea1" type="text" class="validate[required,custom[onlyLetter],length[0,100]] feedback-input" placeholder="Linea 1"  />
      </p>
      <p class="name">
        <input name="linea2" type="text" class="validate[required,custom[onlyLetter],length[0,100]] feedback-input" placeholder="Linea 2" id="linea2" />
      </p>
      <p class="name">
        <input name="nit" type="text" class="validate[required,custom[onlyLetter]] feedback-input"  id="nit" placeholder="NIT" />
      </p>
      <p class="name">
        <input name="tel" type="text" class="validate[required,custom[onlyLetter]] feedback-input"  id="tel" placeholder="TEL" />
      </p>
      
      <p class="name">
        <input name="dir" type="text" class="validate[required,custom[onlyLetter]] feedback-input"  id="dir" placeholder="Dirección" />
      </p>
      
      <p class="name">
        <input name="footer" type="text" class="validate[required,custom[onlyLetter]] feedback-input" id="footer" placeholder="Pie de recibo" />
      </p>
      
      
      <div class="submit">
        <input input type="submit" name="enviar" value="Ingresar"  id="button-blue"  />
        <div class="ease"></div>
      </div>
    </form>
  </div>
  
<?php 
} //end if 
?> 
        
    </body>
</html>
