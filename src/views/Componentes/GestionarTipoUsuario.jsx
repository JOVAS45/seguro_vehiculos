import React, { useEffect, useRef, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Input, Space, Table } from "antd";
import Highlighter from "react-highlight-words";
import { confirmAction } from "./modalComponentes/ModalConfirm";

const GestionarTipoUsuario = () => {
  const [tiposUsuario, setTiposUsuario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTipoUsuario, setEditingTipoUsuario] = useState(null);
  const [creatingTipoUsuario, setCreatingTipoUsuario] = useState(false);
  const [formData, setFormData] = useState({});
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  const fetchTipoUsuario = async () => {
    try {
      const response = await fetch(
        "https://backend-seguros.campozanodevlab.com/api/tipo_usuario"
      );
      if (!response.ok) throw new Error("Error al obtener los tipos de usuario");
      const data = await response.json();
      setTiposUsuario(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTipoUsuario();
  }, []);

  const handleEdit = (tipoUsuario) => {
    setEditingTipoUsuario(tipoUsuario);
    setFormData(tipoUsuario);
  };

  const handleCreate = () => {
    setCreatingTipoUsuario(true);
    setFormData({ nombre: "" });
  };

  const userId = localStorage.getItem("userId");

  const getUserIp = async () => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Error obteniendo IP:", error);
      return "IP desconocida";
    }
  };

  const handleDelete = async (id) => {
    confirmAction(async () => {
      try {
        await fetch(
          `https://backend-seguros.campozanodevlab.com/api/tipo_usuario/${id}`,
          {
            method: "DELETE",
          }
        );
        setTiposUsuario(tiposUsuario.filter((tipoUsuario) => tipoUsuario.id !== id));

        const userIp = await getUserIp();
        const logData = {
          usuario_id: userId,
          accion: "Eliminó",
          detalles: `El Usuario ID: ${userId} eliminó el Tipo Usuario ID: ${id}`,
          ip: userIp,
        };

        await logAction(logData);
      } catch (error) {
        setError("Error al eliminar el tipo de usuario");
        console.error("Error al eliminar el tipo de usuario:", error);
      }
    });
  };

  const logAction = async (logData) => {
    const token = "simulated-token";
    try {
      await fetch("https://backend-seguros.campozanodevlab.com/api/bitacora", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(logData),
      });
    } catch (error) {
      console.error("Error al registrar la acción en la bitácora:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    confirmAction(async () => {
      try {
        if (creatingTipoUsuario) {
          // Si estamos creando un nuevo tipo de usuario
          const response = await fetch(
            "https://backend-seguros.campozanodevlab.com/api/tipousuario",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData),
            }
          );
          const newTipoUsuario = await response.json();
          setTiposUsuario([...tiposUsuario, newTipoUsuario]);

          const userIp = await getUserIp();
          const logData = {
            usuario_id: userId,
            accion: "Creó",
            detalles: `El Usuario ID: ${userId} creó un nuevo Tipo Usuario: ${newTipoUsuario.nombre}`,
            ip: userIp,
          };
          await logAction(logData);
          setCreatingTipoUsuario(false); // Cerrar el modal de creación
        } else {
          // Si estamos editando un tipo de usuario existente
          const previousTipoUsuarioResponse = await fetch(
            `https://backend-seguros.campozanodevlab.com/api/tipousuario/${editingTipoUsuario.id}`
          );
          const previousTipoUsuario = await previousTipoUsuarioResponse.json();

          const response = await fetch(
            `https://backend-seguros.campozanodevlab.com/api/tipousuario/${editingTipoUsuario.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData),
            }
          );
          const updatedTipoUsuario = await response.json();
          setTiposUsuario((prev) =>
            prev.map((tipoUsuario) =>
              tipoUsuario.id === updatedTipoUsuario.id ? updatedTipoUsuario : tipoUsuario
            )
          );

          const userIp = await getUserIp();
          const attributesToCheck = ["Nombre"];
          const editedAttribute = attributesToCheck.find(
            (key) => formData[key] !== previousTipoUsuario[key]
          );

          let logDetails = "";
          if (editedAttribute) {
            logDetails = `Atributo editado: ${editedAttribute}`;
          }

          const logData = {
            usuario_id: userId,
            accion: "Editó",
            detalles: `El Usuario ID: ${userId} editó el Tipo Usuario ID: ${editingTipoUsuario.id}. ${logDetails}`,
            ip: userIp,
          };

          await logAction(logData);
          setEditingTipoUsuario(null);
        }
        fetchTipoUsuario();
      } catch (error) {
        setError("Error al guardar el tipo de usuario");
        console.error("Error al guardar el tipo de usuario:", error);
      }
    });
  };

  const styles = {
    body: {
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f9f9f9",
      margin: 0,
      padding: "20px",
    },
    h1: {
      textAlign: "center",
      color: "#333",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "20px",
      backgroundColor: "#fff",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
    th: {
      padding: "12px 15px",
      textAlign: "left",
      borderBottom: "1px solid #ddd",
      backgroundColor: "#007bff",
      color: "white",
    },
    td: {
      padding: "12px 15px",
      textAlign: "left",
      borderBottom: "1px solid #ddd",
    },
    trEven: {
      backgroundColor: "#f9f9f9",
    },
    trOdd: {
      backgroundColor: "#ffffff",
    },
    button: {
      marginRight: "10px",
      padding: "5px 10px",
      cursor: "pointer",
    },
    modal: {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      zIndex: 1000,
      width: "400px",
    },
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 999,
    },
    input: {
      width: "100%",
      padding: "10px",
      margin: "5px 0",
      borderRadius: "4px",
      border: "1px solid #ccc",
    },
    submitButton: {
      padding: "10px 15px",
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    },
  };

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Buscar ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Buscar
          </Button>
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reiniciar
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase())
        : "",
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: "20%",
      ...getColumnSearchProps("id"),
    },
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      width: "50%",
      ...getColumnSearchProps("nombre"),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: "30%",
      render: (_, record) => (
        <>
          <Button
            onClick={() => handleEdit(record)}
            style={{ marginRight: "10px" }}
          >
            Editar
          </Button>
          <Button onClick={() => handleDelete(record.id)} danger>
            Eliminar
          </Button>
        </>
      ),
    },
  ];

  return (
    <div style={styles.body}>
      <h1 style={styles.h1}>GESTIONAR TIPOS DE USUARIO</h1>
      <Button
        type="primary"
        onClick={handleCreate}
        style={{ marginBottom: "20px" }}
      >
        Crear Tipo Usuario
      </Button>
      <Table
        columns={columns}
        dataSource={tiposUsuario}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        loading={loading}
        locale={{
          emptyText: "No se encontraron resultados",
        }}
      />
      {(editingTipoUsuario || creatingTipoUsuario) && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <form onSubmit={handleSubmit}>
              <label htmlFor="nombre">Nombre:</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                style={styles.input}
                required
              />
              <div>
                <button type="submit" style={styles.submitButton}>
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTipoUsuario(null);
                    setCreatingTipoUsuario(false); // Cerrar modal de creación
                    setFormData({});
                  }}
                  style={styles.submitButton}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
  
};

export default GestionarTipoUsuario;
