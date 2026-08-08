package com.airlines.company.database.repository;

import com.airlines.company.database.model.ModeloAeronave;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IModeloAeronaveRepository extends JpaRepository<ModeloAeronave, String> {

    List<ModeloAeronave> findAllByOrderByFabricanteAscModeloAsc();
}
