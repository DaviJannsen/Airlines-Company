package com.airlines.company.database.repository;

import com.airlines.company.database.model.DestinadoA;
import com.airlines.company.database.model.DestinadoAId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IDestinadoARepository extends JpaRepository<DestinadoA, DestinadoAId> {

    long countByVoo_NumVoo(String numVoo);
}
