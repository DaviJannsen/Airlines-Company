package com.airlines.company.database.repository;

import com.airlines.company.database.model.FuncionarioIdioma;
import com.airlines.company.database.model.FuncionarioIdiomaId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IFuncionarioIdiomaRepository extends JpaRepository<FuncionarioIdioma, FuncionarioIdiomaId> {

    void deleteByFuncionario_IdFuncionario(Integer idFuncionario);
}
