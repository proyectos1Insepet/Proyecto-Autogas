<html>
 <head>
  <link rel="stylesheet" type="text/css" href="estilo.css">
  <meta charset="UTF-8">
  <script script type="text/javascript" src="form.js"></script>
  <title>Formulario de inicio</title>
 </head>
 <body>
 <header class="header"><!--<img  src="fondo.jpg" width="180" height="119"></br></br>--> Configuración de parámetros de inicio </header>
 
<div id="form-main">
  <div id="form-div">

<?php
        
$name = isset($_POST['linea1'])? $_POST['linea1'] : NULL;
$email = isset($_POST['linea2'])? $_POST['linea2'] : NULL;
$phone = isset($_POST['nit'])? $_POST['nit'] : NULL;
$message = isset($_POST['tel'])? $_POST['tel'] : NULL;


$para = 'proyectos1@insepet.com';
$titulo = 'Nuevo contacto';
$header = 'From: ' . $email;
$msjCorreo = "Nombre: $name\n E-Mail: $email\n  Telefono: $phone\n   Mensaje:\n $message";
  
if (isset($_POST['submit'])) {
if (mail($para, $titulo, $msjCorreo, $header)) {
echo "<script language='javascript'>
alert('Mensaje enviado, muchas gracias.');
window.location.href = 'http://www.insepet.com';
</script>";
} else {
echo 'Falló el envio';
}
}
        ?>	
</div>
</div>

</body>
</html>		