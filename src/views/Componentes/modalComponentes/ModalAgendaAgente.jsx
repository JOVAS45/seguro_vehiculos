import React, { useState, useEffect } from 'react';
import { Badge, Calendar, Spin, Modal, List } from 'antd';
import dayjs from 'dayjs';
import axios from 'axios';
import '../CSS/ModalAgendaUsuario.css';

const ModalAgendaAgente = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCitas, setSelectedCitas] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [citas, setCitas] = useState([]);
  const [usuarios, setUsuarios] = useState({});
  const [ip, setIp] = useState("");

  // Obtener el ID del usuario autenticado
  const userId = Number(localStorage.getItem("userId"));

  // Obtener datos de citas y usuarios
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener citas
        const citasResponse = await axios.get("https://backend-seguros.campozanodevlab.com/api/citas");

        // Filtrar solo las citas del usuario autenticado
        const citasDelUsuario = citasResponse.data.filter(cita => cita.recepcion_id === userId);
        setCitas(citasDelUsuario);

        // Obtener todos los usuarios
        const usuariosResponse = await axios.get("https://backend-seguros.campozanodevlab.com/api/usuarios");
        const usuariosData = {};
        usuariosResponse.data.forEach(usuario => {
          usuariosData[usuario.id] = { nombre: usuario.nombre, apellido: usuario.apellido }; // Suponiendo que los campos son nombre y apellido
        });
        setUsuarios(usuariosData); // Guardar usuarios en el estado

      } catch (err) {
        setError('Error al cargar las citas o usuarios');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]); // El useEffect depende del userId

  const citasPorFecha = () => {
    return citas.reduce((acc, cita) => {
      const fechaCita = dayjs(cita.fecha).format('DD/MM/YYYY');
      if (!acc[fechaCita]) {
        acc[fechaCita] = [];
      }
      acc[fechaCita].push({
        ...cita,
        Fecha: dayjs(cita.fecha).format('DD/MM/YYYY, HH:mm:ss'),
        FechaCreada: dayjs(cita.fechaCreacion).format('DD/MM/YYYY'),
      });
      return acc;
    }, {});
  };

  const fetchIp = async () => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      setIp(data.ip);
    } catch (error) {
      console.error("Error al obtener la IP:", error);
    }
  };

  // Registrar en Bitácora
  const registrarBitacora = async () => {
    const userId = parseInt(localStorage.getItem("userId"), 10);

    const bitacoraEntry = {
      usuario_id: userId,
      accion: "Visitó Agenda",
      detalles: "Revisó Citas",
      ip: ip,
    };

    try {
      const response = await fetch(
        "https://backend-seguros.campozanodevlab.com/api/bitacora",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bitacoraEntry),
        }
      );
      if (!response.ok) throw new Error("Error al registrar en bitácora");
      console.log("Registro en bitácora exitoso");
    } catch (error) {
      console.error("Error al registrar en bitácora:", error);
    }
  };

  useEffect(() => {
    fetchIp();
  }, []);

  useEffect(() => {
    if (ip) {
      registrarBitacora(); // Solo registra en bitácora después de obtener la IP
    }
  }, [ip]);

  const getListData = (value) => {
    const fechaActual = value.format('DD/MM/YYYY');
    const citasDelDia = citasPorFecha()[fechaActual] || [];

    citasDelDia.sort((a, b) => dayjs(a.fecha).diff(dayjs(b.fecha)));

    return citasDelDia.map((cita) => {
      const solicitante = usuarios[cita.solicitante_id] || { nombre: 'Desconocido', apellido: '' };
      const recepcionista = usuarios[cita.recepcion_id] || { nombre: 'Desconocido', apellido: '' };

      return {
        type: cita.estado === 'atendido' ? 'success' : 'warning',
        content: `${cita.motivo || 'Cita'} - ${dayjs(cita.fecha).format('HH:mm')} (${solicitante.nombre} ${solicitante.apellido} / ${recepcionista.nombre} ${recepcionista.apellido})`,
      };
    });
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item) => (
          <li key={item.content}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  const onSelectDate = (value) => {
    const fechaActual = value.format('DD/MM/YYYY');
    const citasDelDia = citasPorFecha()[fechaActual] || [];

    citasDelDia.sort((a, b) => dayjs(a.fecha).diff(dayjs(b.fecha)));

    setSelectedCitas(citasDelDia);
    setSelectedDate(fechaActual);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const cellRender = (current, info) => {
    if (info.type === 'date') return dateCellRender(current);
    return info.originNode;
  };

  const calendarContainerStyle = {
    width: '1000px',
    height: '650px',
    overflow: 'hidden',
    transform: 'scale(1)',
    transformOrigin: 'bottom',
    margin: '0 auto',
  };

  const centro = {
    display: 'flex',
    justifyContent: 'center',
    //alignItems: 'center',
   // height: '100vh', // Ajusta si es necesario
    textAlign: 'center',
  };

  if (loading) {
    return <Spin tip="Cargando citas..." />;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1 style={centro}>MI AGENDA</h1>
      <div style={calendarContainerStyle}>
        <Calendar cellRender={cellRender} onSelect={onSelectDate} />
      </div>

      <Modal
        title={`Citas para el día ${selectedDate}`}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        {selectedCitas.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={selectedCitas}
            renderItem={(cita) => {
              const solicitante = usuarios[cita.solicitante_id] || { nombre: 'Desconocido', apellido: '' };
              const recepcionista = usuarios[cita.recepcion_id] || { nombre: 'Desconocido', apellido: '' };

              return (
                <List.Item>
                  <List.Item.Meta
                    title={`Motivo: ${cita.motivo || 'No especificado'}`}
                    description={`Fecha Creada: ${dayjs(cita.fechaCreacion).format('DD/MM/YYYY')} - Hora: ${dayjs(cita.fecha).format('HH:mm:ss')} - Duración: ${cita.duracion} minutos - Solicitud: ${solicitante.nombre} ${solicitante.apellido} - Recepcionista: ${recepcionista.nombre} ${recepcionista.apellido}`}
                  />
                </List.Item>
              );
            }}
          />
        ) : (
          <p>No hay citas para esta fecha.</p>
        )}
      </Modal>
    </div>
  );
};

export default ModalAgendaAgente;
