SELECT 'order' AS tbl, count(*) FROM public."order"
UNION ALL
SELECT 'trip', count(*) FROM public.trip
UNION ALL
SELECT 'user', count(*) FROM public."user"
UNION ALL
SELECT 'hub', count(*) FROM public.hub
UNION ALL
SELECT 'vehicle', count(*) FROM public.vehicle
UNION ALL
SELECT 'driver', count(*) FROM public.driver
UNION ALL
SELECT 'notification', count(*) FROM public.notification;
