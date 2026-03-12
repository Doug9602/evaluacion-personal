import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

def enviar_correo(destinatario, asunto, cuerpo_html, adjunto_nombre=None, adjunto_contenido=None, adjunto_tipo='text/html'):
    msg = EmailMessage()
    msg['Subject'] = asunto
    msg['From'] = os.getenv('MAIL_DEFAULT_SENDER')
    msg['To'] = destinatario
    msg.set_content("Este correo requiere un cliente que soporte HTML.", subtype='plain')
    msg.add_alternative(cuerpo_html, subtype='html')

    if adjunto_nombre and adjunto_contenido:
        msg.add_attachment(adjunto_contenido, maintype='application', subtype=adjunto_tipo, filename=adjunto_nombre)

    with smtplib.SMTP(os.getenv('MAIL_SERVER'), int(os.getenv('MAIL_PORT'))) as server:
        server.starttls()
        server.login(os.getenv('MAIL_USERNAME'), os.getenv('MAIL_PASSWORD'))
        server.send_message(msg)