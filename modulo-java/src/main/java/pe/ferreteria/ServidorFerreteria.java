package pe.ferreteria;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.util.*;
import com.fasterxml.jackson.databind.*;

public class ServidorFerreteria {
 private static final Logger log=LoggerFactory.getLogger(ServidorFerreteria.class);
 public static void main(String[] args) throws Exception {
  Path site=Paths.get("../Pagina web cesar tiene todo actualizado solo falta conexion a base de datos y pasarela de pago con tarjeta").toAbsolutePath().normalize();
  if(!Files.isDirectory(site)) throw new IllegalStateException("No se encuentra la carpeta original de la pagina web: "+site);
  HttpServer server=HttpServer.create(new InetSocketAddress("127.0.0.1",8080),0);
  server.createContext("/api/reportes/productos", ex->{
   if(!ex.getRequestMethod().equals("POST")){send(ex,405,"Use POST desde la pagina Productos","text/plain");return;}
   try {
    byte[] input=ex.getRequestBody().readNBytes(1024*1024+1);
    if(input.length>1024*1024){send(ex,413,"Catalogo demasiado grande","text/plain");return;}
    JsonNode products=new ObjectMapper().readTree(input);
    if(!products.isArray() || products.isEmpty() || products.size()>10000){send(ex,400,"Catalogo invalido","text/plain");return;}
    try(Workbook book=new XSSFWorkbook(); ByteArrayOutputStream bytes=new ByteArrayOutputStream()){
     Sheet sheet=book.createSheet("Catalogo productos");
     String[] headers={"Codigo","Producto","Categoria","Precio (S/)","Stock","Imagen","Ficha tecnica"};
     Row head=sheet.createRow(0);
     for(int j=0;j<headers.length;j++)head.createCell(j).setCellValue(headers[j]);
     int i=1;
     for(JsonNode p:products){
      Row row=sheet.createRow(i++);
      row.createCell(0).setCellValue(p.path("id").asText(""));
      row.createCell(1).setCellValue(p.path("nombre").asText(""));
      row.createCell(2).setCellValue(p.path("categoria").asText(""));
      row.createCell(3).setCellValue(p.path("precio").asDouble(0));
      if(p.hasNonNull("stock"))row.createCell(4).setCellValue(p.path("stock").asDouble());
      else row.createCell(4).setCellValue("No registrado");
      row.createCell(5).setCellValue(p.path("imagen").asText(""));
      row.createCell(6).setCellValue(p.path("ficha").asText(""));
     }
     for(int j=0;j<headers.length;j++)sheet.autoSizeColumn(j);
     book.write(bytes);byte[] data=bytes.toByteArray();
     ex.getResponseHeaders().set("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
     ex.getResponseHeaders().set("Content-Disposition","attachment; filename=productos_ferreteria.xlsx");
     ex.sendResponseHeaders(200,data.length);
     try(OutputStream os=ex.getResponseBody()){os.write(data);}
     log.info("Reporte Excel generado con {} productos",products.size());
    }
   }catch(Exception e){log.error("Error al generar Excel",e);send(ex,500,"Error al generar reporte","text/plain");}
  });
  server.createContext("/",ex->{
   try{
    if(!ex.getRequestMethod().equals("GET")&&!ex.getRequestMethod().equals("HEAD")){send(ex,405,"Metodo no permitido","text/plain");return;}
    String raw=ex.getRequestURI().getPath();String path=URLDecoder.decode(raw,"UTF-8");if(path.equals("/"))path="/index.html";
    Path target=site.resolve(path.substring(1)).normalize();if(!target.startsWith(site)||!Files.isRegularFile(target)){send(ex,404,"Archivo no encontrado","text/plain");return;}
    String type=Files.probeContentType(target);if(type==null){if(path.endsWith(".js"))type="application/javascript";else if(path.endsWith(".css"))type="text/css";else if(path.endsWith(".svg"))type="image/svg+xml";else type="application/octet-stream";}
    byte[] data=Files.readAllBytes(target);ex.getResponseHeaders().set("Content-Type",type+(type.startsWith("text/")||type.equals("application/javascript")?"; charset=UTF-8":""));ex.sendResponseHeaders(200,ex.getRequestMethod().equals("HEAD")?-1:data.length);try(OutputStream os=ex.getResponseBody()){if(!ex.getRequestMethod().equals("HEAD"))os.write(data);}
   }catch(Exception e){log.error("Error al servir recurso web",e);send(ex,500,"Error interno","text/plain");}
  });
  server.start();log.info("Servidor iniciado en http://localhost:8080/ ; reporte del catalogo disponible en Productos");System.out.println("Abre http://localhost:8080/pages/productos.html");
 }
 private static void send(HttpExchange ex,int status,String msg,String type)throws IOException{byte[] bytes=msg.getBytes(java.nio.charset.StandardCharsets.UTF_8);ex.getResponseHeaders().set("Content-Type",type+"; charset=UTF-8");ex.sendResponseHeaders(status,bytes.length);try(OutputStream os=ex.getResponseBody()){os.write(bytes);}}
}
