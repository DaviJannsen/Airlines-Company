package com.airlines.company.database.repository;

import com.airlines.company.database.model.EscalaTrabalho;
import com.airlines.company.database.model.EscalaTrabalhoId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IEscalaTrabalhoRepository extends JpaRepository<EscalaTrabalho, EscalaTrabalhoId> {

    boolean existsByFuncionario_IdFuncionarioAndVoo_NumVoo(Integer idFuncionario, String numVoo);

    Optional<EscalaTrabalho> findByFuncionario_IdFuncionarioAndVoo_NumVoo(Integer idFuncionario, String numVoo);

    long countByFuncionario_IdFuncionario(Integer idFuncionario);
}
