// Service worker de notificaciones: recibe el aviso con la app cerrada y al
// tocarlo abre (o enfoca) la pantalla correcta.
self.addEventListener("push", (evento) => {
  let datos = { titulo: "Pídelo", cuerpo: "Tienes novedades", url: "/" };
  try {
    datos = { ...datos, ...evento.data.json() };
  } catch {}
  evento.waitUntil(
    self.registration.showNotification(datos.titulo, {
      body: datos.cuerpo,
      icon: "/icono-192.png",
      badge: "/icono-192.png",
      vibrate: [180, 80, 180],
      data: { url: datos.url },
      tag: datos.url, // avisos del mismo destino se agrupan
    })
  );
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const url = evento.notification.data?.url ?? "/";
  evento.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((abiertas) => {
      for (const ventana of abiertas) {
        if ("focus" in ventana) {
          ventana.navigate(url);
          return ventana.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
