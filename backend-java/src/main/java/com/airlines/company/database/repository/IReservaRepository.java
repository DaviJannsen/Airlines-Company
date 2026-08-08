package com.airlines.company.database.repository;

import com.airlines.company.database.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IReservaRepository extends JpaRepository<Reserva, String> {

    boolean existsByCodigoLocalizador(String codigoLocalizador);
}
